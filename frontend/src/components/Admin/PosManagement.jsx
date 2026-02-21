import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_BACKEND_URL;
const POS_ACTIVE_SESSION_KEY = "posActiveSessionId";
const POS_ACTIVE_EMPLOYEE_CONTEXT_KEY = "posActiveEmployeeContext";
const EMPTY_REGISTER_MESSAGE = "Register is empty. Add an item before suspending.";
const REWARD_SPEND_STEP = 250;
const AUTO_SEARCH_MIN_CHARS = 1;
const AUTO_SEARCH_DEBOUNCE_MS = 250;
const MANAGER_DEFAULT_PERMISSIONS = [
  "pos.access",
  "timeclock.access",
  "products.view",
  "orders.view",
  "customer_rewards.view",
];

const emptyCardDetails = {
  nameOnCard: "",
  cardNumber: "",
  expDate: "",
  cvv: "",
};
const emptyCustomerForm = {
  name: "",
  phone: "",
  customerContactEmail: "",
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
  },
};

const CODE39_PATTERNS = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  "/": "nwnwnwnnn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  $: "nwnwnnnwn",
  "*": "nwnnwnwnn",
};

const toCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const normalizeQty3 = (value) => Math.round(Number(value || 0) * 1000) / 1000;
const formatQty3 = (value) => normalizeQty3(value).toFixed(3);
const canRunCustomerLookup = (query = "") => {
  const q = String(query || "").trim();
  if (!q) return false;
  // Numeric search is treated as last 4 phone lookup.
  if (/^\d+$/.test(q)) return q.length >= 4;
  return q.length >= AUTO_SEARCH_MIN_CHARS;
};
const getRegisterDisplayName = (item) => {
  const rawName = String(item?.name || "").trim();
  const sku = String(item?.sku || "").trim();
  const isModaFabric =
    String(item?.category || "").trim().toLowerCase().includes("fabric") &&
    /moda/i.test(rawName);

  if (!isModaFabric) return rawName;

  // Keep only the title part for Moda fabrics and append SKU for easier scanning.
  const titleOnly = rawName.split(/\s+by\s+/i)[0].trim() || rawName;
  return sku ? `${titleOnly} | SKU: ${sku}` : titleOnly;
};
const isFabricItem = (item) => {
  const category = String(item?.category || "").trim().toLowerCase();
  if (category.includes("fabric")) return true;
  return String(item?.name || "").trim().toLowerCase().includes("fabric");
};

const calculateLineDiscountSavings = (item) => {
  const unitPrice = Number(item?.price || 0);
  const qty = Number(item?.quantity || 0);
  const pct = Number(item?.discountPercent || 0);
  return Math.max(0, (unitPrice * qty * pct) / 100);
};

const calculateSaleSavings = (item) => {
  const original = Number(item?.originalPrice || 0);
  const current = Number(item?.price || 0);
  const qty = Number(item?.quantity || 0);
  if (!(original > current)) return 0;
  return Math.max(0, (original - current) * qty);
};

const calculateTotalSavings = ({ items = [], reward = 0 }) => {
  const saleSavings = (items || []).reduce((sum, item) => sum + calculateSaleSavings(item), 0);
  const discountSavings = (items || []).reduce(
    (sum, item) => sum + calculateLineDiscountSavings(item),
    0
  );
  const rewardSavings = Math.max(0, Number(reward || 0));
  const totalSavings = saleSavings + discountSavings + rewardSavings;
  return {
    saleSavings: Number(saleSavings.toFixed(2)),
    discountSavings: Number(discountSavings.toFixed(2)),
    rewardSavings: Number(rewardSavings.toFixed(2)),
    totalSavings: Number(totalSavings.toFixed(2)),
  };
};

const calculateRewardsEligibleSpend = (items = []) =>
  Number(
    (items || [])
      .reduce((sum, item) => {
        const qty = Number(item?.quantity || 0);
        const unitPrice = Number(item?.price || 0);
        const discountPct = Number(item?.discountPercent || 0);
        const isSaleItem = Number(item?.originalPrice || 0) > unitPrice;
        if (isSaleItem) return sum;
        const lineSubtotal = unitPrice * qty;
        const lineDiscount = Math.max(0, (lineSubtotal * discountPct) / 100);
        return sum + Math.max(0, lineSubtotal - lineDiscount);
      }, 0)
      .toFixed(2)
  );

const getRewardProgressFromSpend = (spend = 0) => {
  const normalized = Math.max(0, Number(spend || 0));
  const sinceLast = Number((normalized % REWARD_SPEND_STEP).toFixed(2));
  const toNext =
    sinceLast === 0
      ? 0
      : Number((REWARD_SPEND_STEP - sinceLast).toFixed(2));
  return { sinceLast, toNext };
};

const buildCode39Svg = (value) => {
  const payload = String(value || "")
    .toUpperCase()
    .replace(new RegExp("[^0-9A-Z.$/+%\\- ]", "g"), "");
  const text = `*${payload}*`;
  const narrow = 1;
  const wide = 3;
  const height = 62;
  const quietZone = 10;
  const interCharGap = narrow;
  let x = quietZone;
  const bars = [];

  for (let charIndex = 0; charIndex < text.length; charIndex += 1) {
    const ch = text[charIndex];
    const pattern = CODE39_PATTERNS[ch] || CODE39_PATTERNS[" "];
    for (let i = 0; i < pattern.length; i += 1) {
      const isBar = i % 2 === 0;
      const width = pattern[i] === "w" ? wide : narrow;
      if (isBar) {
        bars.push(`<rect x="${x}" y="0" width="${width}" height="${height}" fill="#111827" />`);
      }
      x += width;
    }
    x += interCharGap;
  }

  const totalWidth = x + quietZone;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${height + 22}" viewBox="0 0 ${totalWidth} ${height + 22}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Receipt barcode">
  <rect x="0" y="0" width="${totalWidth}" height="${height + 22}" fill="#ffffff" />
  ${bars.join("")}
  <text x="${totalWidth / 2}" y="${height + 16}" text-anchor="middle" font-family="monospace" font-size="12" fill="#111827">${payload}</text>
</svg>`;
};

const buildReceiptPrintHtml = (receipt) => {
  const barcodeSvg = buildCode39Svg(receipt?.barcodeValue || "");
  const items = Array.isArray(receipt?.items) ? receipt.items : [];
  const savings = calculateTotalSavings({
    items,
    reward: receipt?.reward,
  });
  const rowsHtml = items
    .map((item) => {
      const qty = Number(item?.quantity || 0);
      const price = Number(item?.price || 0);
      const lineTotal = qty * price;
      return `
        <tr>
          <td>${String(item?.name || "Item")}</td>
          <td style="text-align:center;">${qty}</td>
          <td style="text-align:right;">${toCurrency(price)}</td>
          <td style="text-align:right;">${toCurrency(lineTotal)}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt ${receipt?.orderId || ""}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 10px; color: #111827; }
      .wrap { width: 300px; margin: 0 auto; }
      .center { text-align: center; }
      .title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
      .meta { font-size: 12px; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { padding: 4px 0; vertical-align: top; }
      thead th { border-bottom: 1px dashed #9ca3af; }
      .totals { margin-top: 8px; font-size: 13px; }
      .line { display: flex; justify-content: space-between; padding: 2px 0; }
      .total { font-weight: 700; font-size: 15px; border-top: 1px solid #111827; margin-top: 3px; padding-top: 4px; }
      .reward-box {
        margin-top: 8px;
        border: 1px solid #93c5fd;
        background: #eff6ff;
        border-radius: 6px;
        padding: 6px;
      }
      .barcode { margin-top: 10px; }
      .barcode svg { width: 100%; height: auto; }
      @media print { body { margin: 0; padding: 6px; } .wrap { width: auto; } }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="center title">Queen Bee Quilts</div>
      <div class="center meta">
        <div>Receipt #${receipt?.orderId || "-"}</div>
        <div>${receipt?.printedAt || ""}</div>
        <div>${receipt?.customerName || "Walk-in Customer"}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="line"><span>Subtotal</span><span>${toCurrency(receipt?.subtotal)}</span></div>
        <div class="line"><span>Discount</span><span>-${toCurrency(receipt?.discount).slice(1)}</span></div>
        <div class="line"><span>Reward</span><span>-${toCurrency(receipt?.reward).slice(1)}</span></div>
        <div class="line"><span>Tax</span><span>${toCurrency(receipt?.tax)}</span></div>
        <div class="line total"><span>Total</span><span>${toCurrency(receipt?.total)}</span></div>
        <div class="line"><span>You Saved</span><span>${toCurrency(savings.totalSavings)}</span></div>
        <div class="line"><span>Payment</span><span>${String(receipt?.paymentMethodLabel || "-")}</span></div>
        ${
          receipt?.paymentMethod === "cash"
            ? `<div class="line"><span>Cash Tendered</span><span>${toCurrency(receipt?.cashTendered)}</span></div>
               <div class="line"><span>Change</span><span>${toCurrency(receipt?.changeDue)}</span></div>`
            : ""
        }
        ${
          receipt?.rewardProgressEligible
            ? `<div class="reward-box">
                 <div class="line"><span>Since last reward</span><span>${toCurrency(
                   receipt?.rewardSinceLast || 0
                 )}</span></div>
                 <div class="line"><span>To next $20 reward</span><span>${toCurrency(
                   receipt?.rewardToNext || 0
                 )}</span></div>
               </div>`
            : `<div class="reward-box"><div class="line"><span>Rewards progress</span><span>N/A</span></div></div>`
        }
      </div>

      <div class="barcode center">${barcodeSvg}</div>
      <div class="center meta">Scan barcode to look up receipt details</div>
    </div>
  </body>
</html>`;
};

const RewardSeal = ({ unlocked = false }) => {
  const bg = unlocked
    ? "radial-gradient(circle at 30% 30%, #fff9bf 0%, #d4a017 62%, #8f6a08 100%)"
    : "radial-gradient(circle at 30% 30%, #f0f0f0 0%, #b9b9b9 62%, #7b7b7b 100%)";
  return (
    <div
      className="h-11 w-11 shrink-0 rounded-full border shadow-[0_5px_12px_rgba(0,0,0,0.22),inset_0_2px_5px_rgba(255,255,255,0.35)] text-[8px] font-bold text-white flex items-center justify-center text-center leading-tight px-1"
      style={{ background: bg, borderColor: "rgba(255,255,255,0.75)" }}
      title={unlocked ? "Rewards Unlocked" : "Rewards Locked"}
      aria-label={unlocked ? "Rewards Unlocked" : "Rewards Locked"}
    >
      Rewards
    </div>
  );
};

const PosManagement = () => {
  const navigate = useNavigate();
  const resolveImage = (url) => {
    if (!url) return "";
    if (url.startsWith("/uploads")) return `${API}${url}`;
    return url;
  };

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [suspendedSessions, setSuspendedSessions] = useState([]);
  const [loadingSuspended, setLoadingSuspended] = useState(false);
  const [showSuspendedList, setShowSuspendedList] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [cashError, setCashError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [productResults, setProductResults] = useState([]);
  const [lineDiscountInputs, setLineDiscountInputs] = useState({});
  const [miscLineInputs, setMiscLineInputs] = useState({});
  const [fabricQtyInputs, setFabricQtyInputs] = useState({});

  const [customerQ, setCustomerQ] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [customerSearchAttempted, setCustomerSearchAttempted] = useState(false);
  const [isChangingCustomer, setIsChangingCustomer] = useState(false);
  const [showRewardPrompt, setShowRewardPrompt] = useState(false);
  const [applyingRewardCredit, setApplyingRewardCredit] = useState(false);
  const [dismissedRewardPromptBySession, setDismissedRewardPromptBySession] = useState({});
  const [showCustomerNotes, setShowCustomerNotes] = useState(false);
  const [customerNotesDraft, setCustomerNotesDraft] = useState("");
  const [savingCustomerNotes, setSavingCustomerNotes] = useState(false);
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState(null);
  const [showCustomerFormModal, setShowCustomerFormModal] = useState(false);
  const [customerFormMode, setCustomerFormMode] = useState("create");
  const [customerForm, setCustomerForm] = useState({ ...emptyCustomerForm });
  const [editingCustomerId, setEditingCustomerId] = useState("");
  const [loadingCustomerForm, setLoadingCustomerForm] = useState(false);
  const [savingCustomerForm, setSavingCustomerForm] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  const [cashTenderedInput, setCashTenderedInput] = useState("");
  const cashTenderedInputRef = useRef(null);
  const completeButtonRef = useRef(null);
  const [activeEmployee, setActiveEmployee] = useState(() => {
    try {
      const storedContextRaw = localStorage.getItem(POS_ACTIVE_EMPLOYEE_CONTEXT_KEY);
      const storedContext = storedContextRaw ? JSON.parse(storedContextRaw) : null;
      if (storedContext?._id) {
        return {
          _id: storedContext._id,
          name: storedContext.name || "Employee",
          employeeRole: storedContext.employeeRole || "cashier",
          employeePermissions: Array.isArray(storedContext.permissions)
            ? storedContext.permissions
            : [],
        };
      }

      const raw = localStorage.getItem("userInfo");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.role !== "admin") return null;
      return {
        _id: parsed?._id || parsed?.id || "",
        name: parsed?.name || "Admin",
        employeeRole: "manager",
        employeePermissions:
          Array.isArray(parsed?.employeePermissions) && parsed.employeePermissions.length > 0
            ? parsed.employeePermissions
            : MANAGER_DEFAULT_PERMISSIONS,
      };
    } catch {
      return null;
    }
  });
  const [employeeDirectory, setEmployeeDirectory] = useState([]);
  const [loadingEmployeeDirectory, setLoadingEmployeeDirectory] = useState(false);
  const [selectedEmployeeForPin, setSelectedEmployeeForPin] = useState(null);
  const [showEmployeePickerModal, setShowEmployeePickerModal] = useState(false);
  const [showEmployeeLoginModal, setShowEmployeeLoginModal] = useState(false);
  const [employeePinInput, setEmployeePinInput] = useState("");
  const [employeePinError, setEmployeePinError] = useState("");
  const [authenticatingEmployee, setAuthenticatingEmployee] = useState(false);
  const [metaForm, setMetaForm] = useState({
    title: "",
    stationLabel: "",
    notes: "",
    paymentMethod: "cash",
    paymentDetails: { ...emptyCardDetails },
  });

  const token = localStorage.getItem("userToken");
  const registerSavings = useMemo(
    () =>
      calculateTotalSavings({
        items: selectedSession?.items || [],
        reward: Number(selectedSession?.rewardCreditAppliedAmount || 0),
      }),
    [selectedSession]
  );
  const registerRewardProgress = useMemo(() => {
    const isTaxExemptCustomer = Boolean(selectedSession?.customerTaxExempt);
    if (!selectedSession?.customerUser || isTaxExemptCustomer) {
      return { eligible: false, sinceLast: 0, toNext: 0 };
    }
    const lifetime = Number(selectedSession?.customerLifetimeSpend || 0);
    const inCartEligible = calculateRewardsEligibleSpend(selectedSession?.items || []);
    const projected = Number((lifetime + inCartEligible).toFixed(2));
    const progress = getRewardProgressFromSpend(projected);
    return { eligible: true, ...progress };
  }, [selectedSession]);
  const currentAdminName = useMemo(() => {
    try {
      const raw = localStorage.getItem("userInfo");
      const parsed = raw ? JSON.parse(raw) : null;
      return String(parsed?.name || "Admin").trim() || "Admin";
    } catch {
      return "Admin";
    }
  }, []);

  useEffect(() => {
    if (!activeEmployee) {
      localStorage.removeItem(POS_ACTIVE_EMPLOYEE_CONTEXT_KEY);
      window.dispatchEvent(new CustomEvent("pos-employee-changed", { detail: null }));
      return;
    }
    const context = {
      _id: activeEmployee._id || "",
      name: activeEmployee.name || "",
      employeeRole: activeEmployee.employeeRole || "",
      permissions: Array.isArray(activeEmployee.employeePermissions)
        ? activeEmployee.employeePermissions
        : [],
    };
    localStorage.setItem(POS_ACTIVE_EMPLOYEE_CONTEXT_KEY, JSON.stringify(context));
    window.dispatchEvent(new CustomEvent("pos-employee-changed", { detail: context }));
  }, [activeEmployee]);

  const api = useMemo(
    () =>
      axios.create({
        baseURL: API,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    [token]
  );

  const rememberActiveSession = (id) => {
    if (id) localStorage.setItem(POS_ACTIVE_SESSION_KEY, id);
  };

  const clearRememberedSession = () => {
    localStorage.removeItem(POS_ACTIVE_SESSION_KEY);
  };

  const requireActiveEmployee = () => {
    if (activeEmployee?._id) return true;
    setEmployeePinError("Employee PIN is required to use POS actions.");
    openEmployeePicker();
    return false;
  };

  const loadEmployeeDirectory = async () => {
    try {
      setLoadingEmployeeDirectory(true);
      const { data } = await api.get("/api/admin/pos/employees");
      setEmployeeDirectory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error loading employees");
      setEmployeeDirectory([]);
    } finally {
      setLoadingEmployeeDirectory(false);
    }
  };

  const openEmployeePicker = async () => {
    setEmployeePinError("");
    setSelectedEmployeeForPin(null);
    setEmployeePinInput("");
    setShowEmployeeLoginModal(false);
    setShowEmployeePickerModal(true);
    await loadEmployeeDirectory();
  };

  const chooseEmployeeForPin = (employee) => {
    setSelectedEmployeeForPin(employee);
    setEmployeePinInput("");
    setEmployeePinError("");
    setShowEmployeePickerModal(false);
    setShowEmployeeLoginModal(true);
  };

  const loginEmployeeByPin = async () => {
    if (!selectedEmployeeForPin?._id) {
      setEmployeePinError("Select an employee first.");
      setShowEmployeeLoginModal(false);
      setShowEmployeePickerModal(true);
      return;
    }
    const pin = String(employeePinInput || "").trim();
    if (!/^\d{4}$/.test(pin)) {
      setEmployeePinError("Enter a valid 4-digit PIN.");
      return;
    }

    try {
      setAuthenticatingEmployee(true);
      setEmployeePinError("");
      const { data } = await api.post("/api/admin/pos/employee-login", {
        employeeId: selectedEmployeeForPin._id,
        pin,
      });
      const employee = data?.employee || null;
      if (!employee?._id) {
        setEmployeePinError("Invalid PIN.");
        return;
      }
      setActiveEmployee(employee);
      setShowEmployeeLoginModal(false);
      setSelectedEmployeeForPin(null);
      setEmployeePinInput("");
    } catch (err) {
      setEmployeePinError(err.response?.data?.message || err.message || "Employee login failed.");
    } finally {
      setAuthenticatingEmployee(false);
    }
  };

  const loadSuspendedSessions = async () => {
    try {
      setLoadingSuspended(true);
      const { data } = await api.get("/api/admin/pos/sessions", {
        params: { status: "suspended" },
      });
      setSuspendedSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error loading suspended carts");
    } finally {
      setLoadingSuspended(false);
    }
  };

  const loadSessionById = async (id) => {
    if (!id) {
      setSelectedSession(null);
      return;
    }
    try {
      const { data } = await api.get(`/api/admin/pos/sessions/${id}`);
      const session = data || null;
      setSelectedSession(session);
      setSelectedSessionId(id);
      if (Array.isArray(session?.items) && session.items.length > 0) {
        setError((prev) => (prev === EMPTY_REGISTER_MESSAGE ? "" : prev));
      }
      setLineDiscountInputs({});
      if (session?.status === "active") rememberActiveSession(id);
      if (session?.status !== "active") clearRememberedSession();
      setMetaForm({
        title: session?.title || "",
        stationLabel: session?.stationLabel || "",
        notes: session?.notes || "",
        paymentMethod: session?.paymentMethod || "cash",
        paymentDetails: {
          ...emptyCardDetails,
          ...(session?.paymentDetails || {}),
        },
      });
      setIsChangingCustomer(false);
      setShowCustomerNotes(false);
      setShowRewardPrompt(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error loading cart");
    }
  };

  useEffect(() => {
    const initPos = async () => {
      await loadSuspendedSessions();
      const rememberedId = localStorage.getItem(POS_ACTIVE_SESSION_KEY);
      if (rememberedId) {
        await loadSessionById(rememberedId);
        return;
      }
      await createNewSession();
    };
    initPos();
  }, []);

  const createNewSession = async () => {
    try {
      const { data } = await api.post("/api/admin/pos/sessions", {
        title: "",
        paymentMethod: "cash",
      });
      rememberActiveSession(data?._id);
      await loadSessionById(data?._id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error creating cart");
    }
  };

  const saveMeta = async () => {
    if (!selectedSessionId) return;
    try {
      await api.put(`/api/admin/pos/sessions/${selectedSessionId}`, {
        title: metaForm.title,
        stationLabel: metaForm.stationLabel,
        notes: metaForm.notes,
        paymentMethod: metaForm.paymentMethod,
        paymentDetails: metaForm.paymentDetails,
      });
      await loadSessionById(selectedSessionId);
      await loadSuspendedSessions();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error saving cart details");
    }
  };

  const suspendCurrent = async () => {
    if (!requireActiveEmployee()) return;
    if (!selectedSessionId) return;
    if (!selectedSession?.items?.length) {
      setError(EMPTY_REGISTER_MESSAGE);
      return;
    }
    try {
      await api.put(`/api/admin/pos/sessions/${selectedSessionId}`, { status: "suspended" });
      clearRememberedSession();
      setSelectedSession(null);
      setSelectedSessionId("");
      await loadSuspendedSessions();
      setShowSuspendedList(false);
      await createNewSession();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error suspending cart");
    }
  };

  const openSuspendedSession = async (id) => {
    if (!id) return;
    try {
      await api.put(`/api/admin/pos/sessions/${id}`, { status: "active" });
      await loadSessionById(id);
      await loadSuspendedSessions();
      setShowSuspendedList(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error opening suspended cart");
    }
  };

  const deleteSuspendedSession = async (id) => {
    if (!id) return;
    try {
      await api.delete(`/api/admin/pos/sessions/${id}`);
      if (selectedSessionId === id) {
        clearRememberedSession();
        setSelectedSessionId("");
        setSelectedSession(null);
      }
      await loadSuspendedSessions();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error deleting suspended cart");
    }
  };

  const applyRewardCredit = async (useReward) => {
    if (!selectedSessionId) return;
    try {
      setApplyingRewardCredit(true);
      const { data } = await api.post(`/api/admin/pos/sessions/${selectedSessionId}/reward-credit`, {
        useReward,
      });
      setSelectedSession(data || null);
      setShowRewardPrompt(false);
      // Prompt should only appear once per cart after customer selection.
      setDismissedRewardPromptBySession((prev) => ({ ...prev, [selectedSessionId]: true }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error applying reward credit");
    } finally {
      setApplyingRewardCredit(false);
    }
  };

  const saveCustomerNotes = async () => {
    if (!selectedSession?.customerUser) return;
    try {
      setSavingCustomerNotes(true);
      const previousNotes = String(selectedSession?.customerAdminNotes || "");
      const draftTrimmed = String(customerNotesDraft || "").trim();
      const previousTrimmed = previousNotes.trim();

      let adminNotesToSave = customerNotesDraft;
      if (draftTrimmed !== previousTrimmed) {
        const timestamp = new Date().toLocaleString();
        const stamp = `[Updated by ${currentAdminName} on ${timestamp}]`;
        const base = String(customerNotesDraft || "").trimEnd();
        adminNotesToSave = base ? `${base}\n\n${stamp}` : stamp;
      }

      await api.put(`/api/users/admin/users/${selectedSession.customerUser}`, {
        adminNotes: adminNotesToSave,
      });
      // Refresh customer snapshot stored on the POS session so notes update immediately in POS.
      await api.put(`/api/admin/pos/sessions/${selectedSessionId}`, {
        customerUserId: selectedSession.customerUser,
      });
      await loadSessionById(selectedSessionId);
      setShowCustomerNotes(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error saving customer notes");
    } finally {
      setSavingCustomerNotes(false);
    }
  };

  const searchProducts = async (overrideTerm = "") => {
    const term = String(overrideTerm || searchTerm).trim();
    if (term.length < AUTO_SEARCH_MIN_CHARS) {
      setProductResults([]);
      return;
    }
    try {
      setSearchingProducts(true);
      const { data } = await api.get("/api/admin/products", {
        params: { search: term, limit: 20 },
      });
      const items = Array.isArray(data) ? data : [];
      if (term.toLowerCase().includes("misc")) {
        items.unshift({
          _id: "__misc__",
          name: "Miscellaneous Item",
          category: "Miscellaneous",
          price: 0,
          countInStock: 9999,
          isMisc: true,
        });
      }
      setProductResults(items);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error searching products");
      setProductResults([]);
    } finally {
      setSearchingProducts(false);
    }
  };

  const clearProductSearch = () => {
    setSearchTerm("");
    setProductResults([]);
  };

  const addProductToSession = async (productId) => {
    if (!requireActiveEmployee()) return;
    if (!selectedSessionId) {
      setError("Create a new cart first.");
      return;
    }
    try {
      if (productId === "__misc__") {
        await api.post(`/api/admin/pos/sessions/${selectedSessionId}/items/misc`, {
          name: "Miscellaneous Charge",
          price: 0,
          quantity: 1,
        });
        clearProductSearch();
        await loadSessionById(selectedSessionId);
        return;
      }
      await api.post(`/api/admin/pos/sessions/${selectedSessionId}/items`, {
        productId,
        quantity: 1,
      });
      clearProductSearch();
      await loadSessionById(selectedSessionId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error adding product");
    }
  };

  const updateItemQty = async (productId, qty) => {
    if (!requireActiveEmployee()) return;
    if (!selectedSessionId) return;
    try {
      const parsedQty = Number(qty);
      if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
        setError("Quantity must be greater than 0.");
        return;
      }
      await api.put(`/api/admin/pos/sessions/${selectedSessionId}/items/${productId}`, {
        quantity: normalizeQty3(parsedQty),
      });
      await loadSessionById(selectedSessionId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error updating quantity");
    }
  };

  const commitFabricQty = async (productId, rawValue) => {
    const parsedQty = Number(rawValue);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setError("Fabric quantity must be greater than 0.");
      setFabricQtyInputs((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      return;
    }
    await updateItemQty(productId, normalizeQty3(parsedQty));
    setFabricQtyInputs((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const updateItemDiscount = async (productId, discountPercent) => {
    if (!requireActiveEmployee()) return;
    if (!selectedSessionId) return;
    try {
      await api.put(`/api/admin/pos/sessions/${selectedSessionId}/items/${productId}`, {
        discountPercent: Math.max(0, Number(discountPercent || 0)),
      });
      setLineDiscountInputs((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      await loadSessionById(selectedSessionId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error updating discount");
    }
  };

  const updateItemTaxExempt = async (productId, taxExempt) => {
    if (!requireActiveEmployee()) return;
    if (!selectedSessionId) return;
    try {
      await api.put(`/api/admin/pos/sessions/${selectedSessionId}/items/${productId}`, {
        taxExempt: Boolean(taxExempt),
      });
      await loadSessionById(selectedSessionId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error updating tax exempt flag");
    }
  };

  const updateMiscLine = async (productId, { name, price }) => {
    if (!requireActiveEmployee()) return;
    if (!selectedSessionId) return;
    try {
      await api.put(`/api/admin/pos/sessions/${selectedSessionId}/items/${productId}`, {
        ...(name !== undefined ? { name } : {}),
        ...(price !== undefined ? { price } : {}),
      });
      await loadSessionById(selectedSessionId);
      setMiscLineInputs((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error updating miscellaneous item");
    }
  };

  const removeItem = async (productId) => {
    if (!requireActiveEmployee()) return;
    if (!selectedSessionId) return;
    try {
      await api.delete(`/api/admin/pos/sessions/${selectedSessionId}/items/${productId}`);
      await loadSessionById(selectedSessionId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error removing product");
    }
  };

  const searchCustomers = async (overrideQuery = "") => {
    const q = String(overrideQuery || customerQ).trim();
    if (!canRunCustomerLookup(q)) {
      setCustomerResults([]);
      setCustomerSearchAttempted(false);
      return;
    }
    try {
      setCustomerSearchAttempted(true);
      setSearchingCustomers(true);
      const { data } = await api.get("/api/users/admin/search", { params: { q } });
      setCustomerResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error searching customers");
      setCustomerResults([]);
    } finally {
      setSearchingCustomers(false);
    }
  };

  const clearCustomerSearch = () => {
    setCustomerQ("");
    setCustomerResults([]);
    setCustomerSearchAttempted(false);
  };

  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < AUTO_SEARCH_MIN_CHARS) {
      setProductResults([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      searchProducts(term);
    }, AUTO_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const q = customerQ.trim();
    if (!canRunCustomerLookup(q)) {
      setCustomerResults([]);
      setCustomerSearchAttempted(false);
      return undefined;
    }
    const timer = setTimeout(() => {
      searchCustomers(q);
    }, AUTO_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [customerQ]);

  const openCreateCustomerModal = () => {
    setCustomerFormMode("create");
    setEditingCustomerId("");
    setCustomerForm({ ...emptyCustomerForm });
    setShowCustomerFormModal(true);
  };

  const openEditCustomerModal = async (customerId) => {
    if (!customerId) {
      setError("Select a customer first.");
      return;
    }
    try {
      setLoadingCustomerForm(true);
      const { data } = await api.get(`/api/users/admin/customers/${customerId}`);
      setCustomerFormMode("edit");
      setEditingCustomerId(customerId);
      setCustomerForm({
        name: String(data?.name || ""),
        phone: String(data?.phone || ""),
        customerContactEmail: String(data?.customerContactEmail || ""),
        address: {
          line1: String(data?.address?.line1 || ""),
          line2: String(data?.address?.line2 || ""),
          city: String(data?.address?.city || ""),
          state: String(data?.address?.state || ""),
          zip: String(data?.address?.zip || ""),
        },
      });
      setShowCustomerFormModal(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error loading customer.");
    } finally {
      setLoadingCustomerForm(false);
    }
  };

  const saveCustomerForm = async () => {
    const payload = {
      name: String(customerForm?.name || "").trim(),
      phone: String(customerForm?.phone || "").trim(),
      customerContactEmail: String(customerForm?.customerContactEmail || "").trim(),
      address: {
        line1: String(customerForm?.address?.line1 || "").trim(),
        line2: String(customerForm?.address?.line2 || "").trim(),
        city: String(customerForm?.address?.city || "").trim(),
        state: String(customerForm?.address?.state || "").trim(),
        zip: String(customerForm?.address?.zip || "").trim(),
      },
    };

    if (!payload.name || !payload.phone) {
      setError("Name and phone are required.");
      return;
    }

    try {
      setSavingCustomerForm(true);
      if (customerFormMode === "edit" && editingCustomerId) {
        const { data } = await api.put(`/api/users/admin/customers/${editingCustomerId}`, payload);
        if (selectedSessionId && String(selectedSession?.customerUser || "") === String(editingCustomerId)) {
          await api.put(`/api/admin/pos/sessions/${selectedSessionId}`, { customerUserId: editingCustomerId });
          await loadSessionById(selectedSessionId);
        }
        setCustomerResults((prev) =>
          prev.map((row) =>
            String(row._id) === String(editingCustomerId)
              ? {
                  ...row,
                  name: data?.name || row.name,
                  phone: data?.phone || row.phone,
                  email: data?.customerContactEmail || row.email,
                }
              : row
          )
        );
      } else {
        const { data } = await api.post("/api/users/admin/customers", payload);
        if (data?._id) {
          await assignCustomer(data);
        }
      }
      setShowCustomerFormModal(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error saving customer.");
    } finally {
      setSavingCustomerForm(false);
    }
  };

  const assignCustomer = async (user) => {
    if (!selectedSessionId || !user?._id) return;
    try {
      await api.put(`/api/admin/pos/sessions/${selectedSessionId}`, {
        customerUserId: user._id,
      });
      setDismissedRewardPromptBySession((prev) => {
        const next = { ...prev };
        delete next[selectedSessionId];
        return next;
      });
      setCustomerQ("");
      setCustomerResults([]);
      setIsChangingCustomer(false);
      await loadSessionById(selectedSessionId);
      await loadSuspendedSessions();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error assigning customer");
    }
  };

  const clearCustomerFromSession = async () => {
    if (!selectedSessionId) return;
    try {
      await api.put(`/api/admin/pos/sessions/${selectedSessionId}`, {
        customerUserId: "",
      });
      clearCustomerSearch();
      await loadSessionById(selectedSessionId);
      setIsChangingCustomer(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error clearing customer");
    }
  };

  const completeSale = async () => {
    if (!requireActiveEmployee()) return;
    if (!selectedSessionId) {
      return;
    }
    setCashError("");
    const totalDue = Number(selectedSession?.total || 0);
    const tendered = Number(cashTenderedInput || 0);
    if (metaForm.paymentMethod === "cash" && tendered < totalDue) {
      setCashError("Cash tendered must be at least the total due.");
      return;
    }
    try {
      setCompleting(true);
      await saveMeta();
      const { data } = await api.post(`/api/admin/pos/sessions/${selectedSessionId}/complete`, {
        customerUserId: selectedSession?.customerUser || "",
        employeeUserId: activeEmployee?._id || "",
      });
      const completedSession = data?.session || {};
      const orderId = String(data?.orderId || "");
      const receiptSavings = calculateTotalSavings({
        items: Array.isArray(completedSession?.items) ? completedSession.items : [],
        reward: Number(completedSession?.rewardCreditAppliedAmount || 0),
      });
      const receiptEligible =
        !completedSession?.customerTaxExempt && completedSession?.customerUser
          ? true
          : false;
      const receiptRewardProgress = receiptEligible
        ? getRewardProgressFromSpend(
            Number(completedSession?.customerLifetimeSpend || 0) +
              calculateRewardsEligibleSpend(completedSession?.items || [])
          )
        : { sinceLast: 0, toNext: 0 };
      setLastReceipt({
        orderId,
        printedAt: new Date(completedSession?.completedAt || new Date()).toLocaleString(),
        customerName: completedSession?.customerName || "Walk-in Customer",
        items: Array.isArray(completedSession?.items) ? completedSession.items : [],
        subtotal: Number(completedSession?.subtotal || 0),
        discount: Number(completedSession?.discount || 0),
        reward: Number(completedSession?.rewardCreditAppliedAmount || 0),
        tax: Number(completedSession?.tax || 0),
        total: Number(completedSession?.total || 0),
        paymentMethod: String(completedSession?.paymentMethod || metaForm?.paymentMethod || "cash"),
        paymentMethodLabel:
          String(completedSession?.paymentMethod || metaForm?.paymentMethod || "cash") === "gift_card"
            ? "Gift Card"
            : String(completedSession?.paymentMethod || metaForm?.paymentMethod || "cash") === "credit_card"
            ? "Credit Card"
            : "Cash",
        cashTendered:
          String(completedSession?.paymentMethod || metaForm?.paymentMethod || "cash") === "cash"
            ? Number(tendered || 0)
            : 0,
        changeDue:
          String(completedSession?.paymentMethod || metaForm?.paymentMethod || "cash") === "cash"
            ? Math.max(0, Number((Number(tendered || 0) - Number(completedSession?.total || 0)).toFixed(2)))
            : 0,
        totalSavings: Number(receiptSavings.totalSavings || 0),
        rewardProgressEligible: receiptEligible,
        rewardSinceLast: Number(receiptRewardProgress.sinceLast || 0),
        rewardToNext: Number(receiptRewardProgress.toNext || 0),
        barcodeValue: `QB${orderId.toUpperCase()}`,
      });
      clearRememberedSession();
      setSelectedSessionId("");
      setSelectedSession(null);
      setCustomerQ("");
      setCustomerResults([]);
      setSearchTerm("");
      setProductResults([]);
      await loadSuspendedSessions();
      await createNewSession();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error completing sale");
    } finally {
      setCompleting(false);
    }
  };

  useEffect(() => {
    setCashTenderedInput("");
  }, [selectedSessionId]);

  useEffect(() => {
    if (metaForm.paymentMethod !== "cash") return;
    requestAnimationFrame(() => {
      cashTenderedInputRef.current?.focus();
    });
  }, [metaForm.paymentMethod]);

  const maybePromptRewardOnPaymentSelection = () => {
    const id = selectedSessionId;
    const session = selectedSession;
    if (!id || !session) return;
    const shouldPromptReward =
      Boolean(session?.customerUser) &&
      Number(session?.customerRewardCreditsAvailable || 0) > 0 &&
      Number(session?.rewardCreditAppliedAmount || 0) <= 0 &&
      !dismissedRewardPromptBySession[id];
    if (shouldPromptReward) setShowRewardPrompt(true);
  };

  const selectPaymentMethod = (method) => {
    setMetaForm((prev) => ({ ...prev, paymentMethod: method }));
    maybePromptRewardOnPaymentSelection();
  };

  const selectCashPayment = () => {
    selectPaymentMethod("cash");
    requestAnimationFrame(() => {
      cashTenderedInputRef.current?.focus();
    });
  };

  const normalizeCashAndFocusComplete = () => {
    const raw = String(cashTenderedInput || "").trim();
    if (!raw) return;
    const numeric = Number(raw);
    if (!Number.isFinite(numeric) || numeric < 0) return;
    setCashTenderedInput(numeric.toFixed(2));
    requestAnimationFrame(() => {
      completeButtonRef.current?.focus();
    });
  };

  return (
    <div
      className="max-w-[1400px] mx-auto p-6 rounded-xl relative"
      style={{ backgroundColor: "#f8f5ff" }}
    >
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Queen Bee Quilts POS</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowSuspendedList(true);
              loadSuspendedSessions();
            }}
            className="rounded border px-4 py-2 font-semibold hover:bg-gray-50"
          >
            Suspended List ({suspendedSessions.length})
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded border bg-white p-3">
        <div className="text-sm">
          <span className="font-semibold">Active Employee:</span>{" "}
          <span
            className={
              activeEmployee?._id ? "text-green-700 font-semibold" : "text-red-600 font-semibold"
            }
          >
            {activeEmployee?.name || "Not signed in"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              openEmployeePicker();
            }}
            className="rounded border px-3 py-1.5 text-sm font-semibold hover:bg-gray-50"
          >
            Switch Employee
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700 flex items-start justify-between gap-3">
          <div>{error}</div>
          <button
            type="button"
            onClick={() => setError("")}
            className="rounded border border-red-300 px-2 py-0.5 text-xs font-semibold hover:bg-red-100"
            aria-label="Close message"
          >
            x
          </button>
        </div>
      )}

      <div
        className={`absolute inset-0 z-40 transition-opacity duration-300 ease-out ${
          showSuspendedList ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Close suspended list"
          className="absolute inset-0 bg-black/30"
          onClick={() => setShowSuspendedList(false)}
        />
        <aside
          className={`absolute top-2 right-2 h-[calc(100%-1rem)] w-[360px] rounded-2xl border p-4 overflow-auto transition-transform duration-300 ease-out ${
            showSuspendedList ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#cfb9ee",
            boxShadow:
              "0 18px 38px rgba(67, 35, 122, 0.26), 0 8px 16px rgba(67, 35, 122, 0.14), inset 0 1px 0 rgba(255,255,255,0.65)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Suspended List</h2>
            <button
              type="button"
              onClick={() => setShowSuspendedList(false)}
              className="text-xs leading-none rounded border px-2 py-1 hover:bg-gray-50"
              aria-label="Close suspended list"
            >
              x
            </button>
          </div>

          {loadingSuspended ? (
            <p className="text-sm text-gray-600">Loading suspended carts...</p>
          ) : suspendedSessions.length === 0 ? (
            <p className="text-sm text-gray-600">No suspended carts.</p>
          ) : (
            <ul className="divide-y">
              {suspendedSessions.map((s) => (
                <li key={s._id}>
                  <div className="w-full py-3 text-left px-2 rounded bg-white hover:bg-purple-100 transition-colors duration-150 flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        openSuspendedSession(s._id);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="font-semibold">{s.customerName || "Unassigned Customer"}</div>
                      <div className="text-xs text-gray-600">{s.customerEmail || "No email"}</div>
                      <div className="text-sm mt-1">Total: ${Number(s.total || 0).toFixed(2)}</div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteSessionId(s._id);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-300 bg-white text-red-600 text-base font-bold leading-none hover:bg-red-600 hover:text-white"
                      aria-label="Delete suspended cart"
                      title="Delete suspended cart"
                    >
                      x
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div
          className="xl:col-span-3 rounded border p-4 space-y-5"
          style={{ backgroundColor: "#fcfbff", borderColor: "#d8ccf1" }}
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Customer</h2>
              <button
                type="button"
                onClick={openCreateCustomerModal}
                className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold hover:bg-gray-50"
              >
                Add Customer
              </button>
            </div>
            <div className="rounded border bg-gray-50 p-2 text-sm">
              {selectedSession?.customerUser && !isChangingCustomer ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 font-semibold truncate">
                      Customer: {selectedSession.customerName}
                    </div>
                    <RewardSeal
                      unlocked={Number(selectedSession?.customerRewardCreditsAvailable || 0) > 0}
                    />
                  </div>
                  <div className="text-xs text-gray-600 truncate">{selectedSession.customerEmail}</div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-gray-600">
                      Rewards Available: {Number(selectedSession?.customerRewardCreditsAvailable || 0)} x $20
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerNotesDraft(String(selectedSession?.customerAdminNotes || ""));
                        setShowCustomerNotes(true);
                      }}
                      className={`text-xs ${
                        String(selectedSession?.customerAdminNotes || "").trim()
                          ? "font-bold text-gray-900 hover:underline"
                          : "text-gray-400 hover:underline"
                      }`}
                    >
                      Notes
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearCustomerFromSession}
                      className="rounded bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
                    >
                      Change Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditCustomerModal(selectedSession?.customerUser)}
                      className="rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-50 whitespace-nowrap"
                    >
                      Edit Customer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <input
                      className="w-full rounded border p-2 pr-9 text-sm bg-white"
                      placeholder="Search customers..."
                      value={customerQ}
                      onChange={(e) => {
                        setCustomerQ(e.target.value);
                        setCustomerSearchAttempted(false);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && searchCustomers()}
                    />
                    {customerQ && (
                      <button
                        type="button"
                        onClick={clearCustomerSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                        aria-label="Clear customer search"
                      >
                        {"\u2715"}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={searchCustomers}
                    className="rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    {searchingCustomers ? "..." : "Find"}
                  </button>
                </div>
              )}
            </div>
            <div className="mt-2 space-y-1 max-h-36 overflow-auto">
              {customerResults.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between rounded border p-2 text-sm cursor-pointer hover:bg-gray-50"
                  onClick={() => assignCustomer(u)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") assignCustomer(u);
                  }}
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{u.name}</div>
                    <div className="text-xs text-gray-600 truncate">{u.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      assignCustomer(u);
                    }}
                    className="rounded bg-black px-2 py-1 text-xs text-white"
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditCustomerModal(u._id);
                    }}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Edit
                  </button>
                </div>
              ))}
              {customerSearchAttempted &&
                !searchingCustomers &&
                customerQ.trim().length >= AUTO_SEARCH_MIN_CHARS &&
                customerResults.length === 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
                  No results found.
                </div>
                )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Products</h2>
              <button
                type="button"
                onClick={() => navigate("/admin/products/add")}
                className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold hover:bg-gray-50"
              >
                Add Product
              </button>
            </div>
            <div className="rounded border bg-gray-50 p-2 text-sm">
              <div className="flex gap-2">
                <div className="relative w-full">
                  <input
                    className="w-full rounded border p-2 pr-5 text-sm bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                    placeholder="Search products..."
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={clearProductSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                      aria-label="Clear product search"
                    >
                      {"\u2715"}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={searchProducts}
                  className="rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  {searchingProducts ? "..." : "Search"}
                </button>
              </div>
            </div>
            <div className="mt-2 space-y-1 max-h-80 overflow-auto">
              {productResults.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between rounded border p-2 text-sm cursor-pointer hover:bg-gray-50"
                  onClick={() => addProductToSession(p._id)}
                  role="button"
                  tabIndex={0}
                  title={`${p.name} | $${Number(p.price || 0).toFixed(2)} | Stock ${Number(
                    p.countInStock || 0
                  )}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") addProductToSession(p._id);
                  }}
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-gray-600">
                      {p.isMisc
                        ? `Category: ${p.category || "Miscellaneous"}`
                        : `$${Number(p.price || 0).toFixed(2)} | Stock ${Number(p.countInStock || 0)}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addProductToSession(p._id);
                    }}
                    className="rounded bg-black px-3 py-1 text-xs text-white"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="xl:col-span-9 rounded border p-4"
          style={{ backgroundColor: "#ffffff", borderColor: "#d8ccf1" }}
        >
          <div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">Register</h2>
                <button
                  type="button"
                  onClick={suspendCurrent}
                  className="rounded bg-yellow-400 px-3 py-1 text-sm font-semibold hover:bg-yellow-500"
                >
                  Suspend
                </button>
              </div>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: "#e9ddff" }}>
                    <tr>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-center px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Price</th>
                      <th className="text-right px-3 py-2">Discount %</th>
                      <th className="text-center px-3 py-2">Tax Exempt</th>
                      <th className="text-right px-3 py-2">Line Total</th>
                      <th className="text-right px-3 py-2">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedSession?.items?.length ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-gray-600">
                          No products in register.
                        </td>
                      </tr>
                    ) : (
                      selectedSession.items.map((item, idx) => (
                        <tr
                          key={item.productId}
                          style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f2e9ff" }}
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {item.image && item.lineType !== "misc" ? (
                                <img
                                  src={resolveImage(item.image)}
                                  alt={item.name}
                                  className="w-10 h-10 rounded object-cover border shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded border bg-gray-100 shrink-0" />
                              )}
                              {item.lineType === "misc" ? (
                                <input
                                  type="text"
                                  className="w-full rounded border p-1 text-sm"
                                  value={
                                    Object.prototype.hasOwnProperty.call(miscLineInputs, item.productId)
                                      ? miscLineInputs[item.productId].name
                                      : item.name
                                  }
                                  onChange={(e) =>
                                    setMiscLineInputs((prev) => ({
                                      ...prev,
                                      [item.productId]: {
                                        name: e.target.value,
                                        price: Object.prototype.hasOwnProperty.call(prev, item.productId)
                                          ? prev[item.productId].price
                                          : String(item.price ?? 0),
                                      },
                                    }))
                                  }
                                  onBlur={() => {
                                    const rawName = Object.prototype.hasOwnProperty.call(
                                      miscLineInputs,
                                      item.productId
                                    )
                                      ? miscLineInputs[item.productId].name
                                      : item.name;
                                    updateMiscLine(item.productId, { name: rawName });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key !== "Enter") return;
                                    e.preventDefault();
                                    const rawName = Object.prototype.hasOwnProperty.call(
                                      miscLineInputs,
                                      item.productId
                                    )
                                      ? miscLineInputs[item.productId].name
                                      : item.name;
                                    updateMiscLine(item.productId, { name: rawName });
                                  }}
                                />
                              ) : (
                                <div className="min-w-0">
                                  <div className="truncate">{getRegisterDisplayName(item)}</div>
                                  {Number(item.originalPrice || 0) > Number(item.price || 0) && (
                                    <div className="text-[11px] leading-tight">
                                      <span className="text-gray-400 line-through">
                                        ${Number(item.originalPrice || 0).toFixed(2)}
                                      </span>{" "}
                                      <span className="font-semibold text-red-600">On Sale</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {item.lineType !== "misc" && isFabricItem(item) ? (
                              <input
                                type="number"
                                min="0.001"
                                step="0.125"
                                className="w-16 rounded border p-1 text-right text-xs"
                                value={
                                  Object.prototype.hasOwnProperty.call(fabricQtyInputs, item.productId)
                                    ? fabricQtyInputs[item.productId]
                                    : formatQty3(item.quantity)
                                }
                                onChange={(e) =>
                                  setFabricQtyInputs((prev) => ({
                                    ...prev,
                                    [item.productId]: e.target.value,
                                  }))
                                }
                                onBlur={() => {
                                  const raw = Object.prototype.hasOwnProperty.call(
                                    fabricQtyInputs,
                                    item.productId
                                  )
                                    ? fabricQtyInputs[item.productId]
                                    : item.quantity;
                                  commitFabricQty(item.productId, raw);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter") return;
                                  e.preventDefault();
                                  const raw = Object.prototype.hasOwnProperty.call(
                                    fabricQtyInputs,
                                    item.productId
                                  )
                                    ? fabricQtyInputs[item.productId]
                                    : item.quantity;
                                  commitFabricQty(item.productId, raw);
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  className="rounded border px-2"
                                  onClick={() =>
                                    updateItemQty(item.productId, Math.max(1, Number(item.quantity) - 1))
                                  }
                                >
                                  -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                  type="button"
                                  className="rounded border px-2"
                                  onClick={() => updateItemQty(item.productId, Number(item.quantity) + 1)}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.lineType === "misc" ? (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-24 rounded border p-1 text-right text-xs"
                                value={
                                  Object.prototype.hasOwnProperty.call(miscLineInputs, item.productId)
                                    ? miscLineInputs[item.productId].price
                                    : String(Number(item.price || 0))
                                }
                                onChange={(e) =>
                                  setMiscLineInputs((prev) => ({
                                    ...prev,
                                    [item.productId]: {
                                      name: Object.prototype.hasOwnProperty.call(prev, item.productId)
                                        ? prev[item.productId].name
                                        : item.name,
                                      price: e.target.value,
                                    },
                                  }))
                                }
                                onBlur={() => {
                                  const rawPrice = Object.prototype.hasOwnProperty.call(
                                    miscLineInputs,
                                    item.productId
                                  )
                                    ? miscLineInputs[item.productId].price
                                    : item.price;
                                  updateMiscLine(item.productId, { price: rawPrice });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter") return;
                                  e.preventDefault();
                                  const rawPrice = Object.prototype.hasOwnProperty.call(
                                    miscLineInputs,
                                    item.productId
                                  )
                                    ? miscLineInputs[item.productId].price
                                    : item.price;
                                  updateMiscLine(item.productId, { price: rawPrice });
                                }}
                              />
                            ) : (
                              <>${Number(item.price || 0).toFixed(2)}</>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              className="w-16 rounded border p-1 text-right text-xs"
                              placeholder="0"
                              value={
                                Object.prototype.hasOwnProperty.call(lineDiscountInputs, item.productId)
                                  ? lineDiscountInputs[item.productId]
                                  : Number(item.discountPercent || 0) === 0
                                  ? ""
                                  : String(item.discountPercent)
                              }
                              onChange={(e) =>
                                setLineDiscountInputs((prev) => ({
                                  ...prev,
                                  [item.productId]: e.target.value,
                                }))
                              }
                              onBlur={() => {
                                const raw = Object.prototype.hasOwnProperty.call(
                                  lineDiscountInputs,
                                  item.productId
                                )
                                  ? lineDiscountInputs[item.productId]
                                  : item.discountPercent;
                                updateItemDiscount(item.productId, raw === "" ? 0 : raw);
                              }}
                              onKeyDown={(e) => {
                                if (e.key !== "Enter") return;
                                e.preventDefault();
                                const raw = Object.prototype.hasOwnProperty.call(
                                  lineDiscountInputs,
                                  item.productId
                                )
                                  ? lineDiscountInputs[item.productId]
                                  : item.discountPercent;
                                updateItemDiscount(item.productId, raw === "" ? 0 : raw);
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(item.taxExempt)}
                              onChange={(e) => updateItemTaxExempt(item.productId, e.target.checked)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            $
                            {(
                              Number(item.price || 0) * Number(item.quantity || 0) -
                              (Number(item.price || 0) *
                                Number(item.quantity || 0) *
                                Number(item.discountPercent || 0)) /
                                100
                            ).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeItem(item.productId)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-300 bg-white text-red-600 text-xl font-bold leading-none shadow-[0_2px_0_rgba(185,28,28,0.35),0_4px_10px_rgba(239,68,68,0.18)] transition-all duration-150 hover:bg-red-600 hover:text-white hover:border-red-700 hover:shadow-[0_1px_0_rgba(127,29,29,0.45),0_3px_8px_rgba(127,29,29,0.35)] active:translate-y-px active:shadow-[0_1px_0_rgba(127,29,29,0.45)]"
                              aria-label={`Remove ${item.name}`}
                            >
                              x
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 rounded border p-3">
              <h3 className="font-semibold mb-2">Cart Details</h3>
              <textarea
                className="w-full rounded border p-2 h-48 mb-2"
                placeholder="Notes"
                value={metaForm.notes}
                onChange={(e) => setMetaForm((prev) => ({ ...prev, notes: e.target.value }))}
              />

              <div className="text-sm font-semibold mt-6 mb-2">Payment Type</div>
              <div className="flex flex-wrap items-center justify-end gap-2 mb-3">
                <button
                  type="button"
                  onClick={selectCashPayment}
                  className={`rounded px-3 py-1 text-sm border ${
                    metaForm.paymentMethod === "cash"
                      ? "bg-green-400 border-green-500 text-white hover:bg-green-500"
                      : "bg-white hover:bg-green-50"
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => selectPaymentMethod("gift_card")}
                  className={`rounded px-3 py-1 text-sm border ${
                    metaForm.paymentMethod === "gift_card"
                      ? "bg-sky-400 border-sky-600 text-white ring-2 ring-sky-200"
                      : "bg-sky-400 border-sky-500 text-white hover:bg-sky-500"
                  }`}
                >
                  Gift Card
                </button>
                <button
                  type="button"
                  onClick={() => selectPaymentMethod("credit_card")}
                  className={`rounded px-3 py-1 text-sm border ${
                    metaForm.paymentMethod === "credit_card"
                      ? "bg-yellow-400 border-yellow-600 text-black ring-2 ring-yellow-200"
                      : "bg-yellow-400 border-yellow-500 text-black hover:bg-yellow-500"
                  }`}
                >
                  Credit Card
                </button>
              </div>

              {(metaForm.paymentMethod === "gift_card" ||
                metaForm.paymentMethod === "credit_card") && (
                <div className="space-y-2 mb-3">
                  <input
                    className="w-full rounded border p-2"
                    placeholder="Name on card"
                    value={metaForm.paymentDetails.nameOnCard}
                    onChange={(e) =>
                      setMetaForm((prev) => ({
                        ...prev,
                        paymentDetails: { ...prev.paymentDetails, nameOnCard: e.target.value },
                      }))
                    }
                  />
                  <input
                    className="w-full rounded border p-2"
                    placeholder="Card number"
                    value={metaForm.paymentDetails.cardNumber}
                    onChange={(e) =>
                      setMetaForm((prev) => ({
                        ...prev,
                        paymentDetails: { ...prev.paymentDetails, cardNumber: e.target.value },
                      }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="w-full rounded border p-2"
                      placeholder="Exp date"
                      value={metaForm.paymentDetails.expDate}
                      onChange={(e) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          paymentDetails: { ...prev.paymentDetails, expDate: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="w-full rounded border p-2"
                      placeholder="3 digit code"
                      value={metaForm.paymentDetails.cvv}
                      onChange={(e) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          paymentDetails: { ...prev.paymentDetails, cvv: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              )}

            </div>
            <div className="lg:col-span-4">
              <h2 className="font-semibold mb-2">Totals</h2>
              <div className="rounded border bg-gray-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${Number(selectedSession?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Discount</span>
                  <span>-${Number(selectedSession?.discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Reward Credit</span>
                  <span>-${Number(selectedSession?.rewardCreditAppliedAmount || 0).toFixed(2)}</span>
                </div><div className="flex justify-between mt-2">
                  <span>Tax</span>
                  <span>${Number(selectedSession?.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2 font-bold text-base">
                  <span>Total</span>
                  <span>${Number(selectedSession?.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2 font-semibold text-emerald-700">
                  <span>You Saved</span>
                  <span>${Number(registerSavings.totalSavings || 0).toFixed(2)}</span>
                </div>
                {registerRewardProgress.eligible ? (
                  <div className="mt-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800">
                    <div className="flex justify-between">
                      <span>Since last reward</span>
                      <span>${Number(registerRewardProgress.sinceLast || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>To next $20 reward</span>
                      <span>${Number(registerRewardProgress.toNext || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                    Rewards progress unavailable for this customer.
                  </div>
                )}
                {Number(selectedSession?.rewardCreditAppliedCount || 0) > 0 &&
                  Number(selectedSession?.rewardCreditAppliedAmount || 0) < 20 && (
                    <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                      Spend $
                      {(20 - Number(selectedSession?.rewardCreditAppliedAmount || 0)).toFixed(2)}
                      {" "}more to use the full $20 reward.
                    </div>
                  )}
              </div>

              {metaForm.paymentMethod === "cash" && (
                <div className="mt-3 rounded border bg-gray-50 p-3">
                  <div className="relative">
                    {String(cashTenderedInput || "").trim() !== "" && (
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-3xl font-bold leading-tight text-gray-600 font-mono">
                        $
                      </span>
                    )}
                    <input
                      ref={cashTenderedInputRef}
                      type="text"
                      inputMode="decimal"
                      className="w-full rounded border bg-white px-4 py-2 text-3xl font-bold leading-tight text-right placeholder:text-center font-mono"
                      placeholder="Cash Tendered"
                      value={cashTenderedInput}
                      onChange={(e) => {
                        setCashError("");
                        const raw = String(e.target.value || "");
                        const sanitized = raw
                          .replace(/[^\d.]/g, "")
                          .replace(/(\..*)\./g, "$1");
                        setCashTenderedInput(sanitized);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        normalizeCashAndFocusComplete();
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>Change</span>
                    <span className="font-semibold">
                      $
                      {Math.max(
                        0,
                        Number(
                          (
                            Number(cashTenderedInput || 0) - Number(selectedSession?.total || 0)
                          ).toFixed(2)
                        )
                      ).toFixed(2)}
                    </span>
                  </div>
                  {cashError && <div className="mt-2 text-xs text-red-600">{cashError}</div>}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCashTenderedInput("");
                    setCashError("");
                    if (metaForm.paymentMethod === "cash") {
                      requestAnimationFrame(() => cashTenderedInputRef.current?.focus());
                    }
                  }}
                  className="mr-2 min-w-[96px] rounded border border-gray-400 bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
                >
                  Clear
                </button>
                <button
                  ref={completeButtonRef}
                  type="button"
                  onClick={completeSale}
                  disabled={completing}
                  className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                >
                  {completing ? "Completing..." : "Complete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEmployeePickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Select Employee</h3>
            <p className="text-sm text-gray-700 mb-3">
              Choose an employee, then enter their 4-digit PIN.
            </p>
            <div className="max-h-72 overflow-auto rounded border">
              {loadingEmployeeDirectory ? (
                <div className="p-3 text-sm text-gray-600">Loading employees...</div>
              ) : employeeDirectory.length === 0 ? (
                <div className="p-3 text-sm text-gray-600">No POS-enabled employees found.</div>
              ) : (
                employeeDirectory.map((emp) => (
                  <button
                    key={emp._id}
                    type="button"
                    onClick={() => chooseEmployeeForPin(emp)}
                    className="w-full border-b last:border-b-0 px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <div className="font-semibold text-sm">{emp.name}</div>
                    <div className="text-xs text-gray-600">
                      {String(emp.employeeRole || "cashier").replace(/_/g, " ")}
                      {emp.hasPin ? "" : " - No PIN set yet"}
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEmployeePickerModal(false)}
                className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmployeeLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold mb-2">
              Employee PIN: {selectedEmployeeForPin?.name || "Employee"}
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Enter the 4-digit PIN for the selected employee.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="mx-auto block w-28 rounded border px-2 py-1 text-center text-lg tracking-[0.22em]"
              value={employeePinInput}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 4);
                setEmployeePinInput(digitsOnly);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                loginEmployeeByPin();
              }}
              autoFocus
            />
            {employeePinError && (
              <div className="mt-2 text-sm text-red-600">{employeePinError}</div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowEmployeeLoginModal(false);
                  setShowEmployeePickerModal(true);
                  setEmployeePinError("");
                }}
                className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmployeeLoginModal(false);
                  setSelectedEmployeeForPin(null);
                  setEmployeePinError("");
                }}
                className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={loginEmployeeByPin}
                disabled={authenticatingEmployee}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {authenticatingEmployee ? "Verifying..." : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRewardPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white border shadow-2xl p-5">
            <h3 className="text-lg font-bold mb-2">Customer Reward Available</h3>
            <p className="text-sm text-gray-700">
              {selectedSession?.customerName} has{" "}
              <span className="font-semibold">
                {Number(selectedSession?.customerRewardCreditsAvailable || 0)} reward
                {Number(selectedSession?.customerRewardCreditsAvailable || 0) === 1 ? "" : "s"}
              </span>{" "}
              available. Apply one <span className="font-semibold">$20</span> reward to this purchase?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => applyRewardCredit(false)}
                disabled={applyingRewardCredit}
                className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => applyRewardCredit(true)}
                disabled={applyingRewardCredit}
                className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
              >
                {applyingRewardCredit ? "Applying..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomerNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xs rounded-lg border bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold">Customer Notes</h4>
              <button
                type="button"
                onClick={() => setShowCustomerNotes(false)}
                className="text-xs rounded border px-2 py-1 hover:bg-gray-50"
              >
                x
              </button>
            </div>
            <textarea
              className="w-full rounded border p-2 text-sm h-28 mb-3"
              placeholder="Add customer notes..."
              value={customerNotesDraft}
              onChange={(e) => setCustomerNotesDraft(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomerNotes(false)}
                className="rounded border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCustomerNotes}
                disabled={savingCustomerNotes}
                className="rounded bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {savingCustomerNotes ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomerFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {customerFormMode === "edit" ? "Edit Customer" : "Add Customer"}
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomerFormModal(false)}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              >
                x
              </button>
            </div>

            {loadingCustomerForm ? (
              <div className="py-8 text-center text-sm text-gray-600">Loading customer...</div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    className="w-full rounded border p-2"
                    placeholder="Name *"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    className="w-full rounded border p-2"
                    placeholder="Phone *"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <input
                  className="w-full rounded border p-2"
                  placeholder="Email (optional)"
                  value={customerForm.customerContactEmail}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({ ...prev, customerContactEmail: e.target.value }))
                  }
                />
                <input
                  className="w-full rounded border p-2"
                  placeholder="Address Line 1"
                  value={customerForm.address.line1}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      address: { ...prev.address, line1: e.target.value },
                    }))
                  }
                />
                <input
                  className="w-full rounded border p-2"
                  placeholder="Address Line 2"
                  value={customerForm.address.line2}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      address: { ...prev.address, line2: e.target.value },
                    }))
                  }
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    className="w-full rounded border p-2"
                    placeholder="City"
                    value={customerForm.address.city}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value },
                      }))
                    }
                  />
                  <input
                    className="w-full rounded border p-2"
                    placeholder="State"
                    value={customerForm.address.state}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value },
                      }))
                    }
                  />
                  <input
                    className="w-full rounded border p-2"
                    placeholder="ZIP"
                    value={customerForm.address.zip}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        address: { ...prev.address, zip: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomerFormModal(false)}
                className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCustomerForm}
                disabled={savingCustomerForm || loadingCustomerForm}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {savingCustomerForm ? "Saving..." : customerFormMode === "edit" ? "Save Changes" : "Create Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold mb-2">Delete Suspended Cart</h3>
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this suspended cart? This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteSessionId(null)}
                className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = confirmDeleteSessionId;
                  setConfirmDeleteSessionId(null);
                  await deleteSuspendedSession(id);
                }}
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-5 shadow-2xl">
            <h3 className="text-center text-2xl font-bold mb-1">Queen Bee Quilts</h3>
            <div className="text-center text-xs text-gray-600 mb-3">
              <div>Receipt #{lastReceipt.orderId}</div>
              <div>{lastReceipt.printedAt}</div>
              <div>{lastReceipt.customerName}</div>
            </div>

            <div className="max-h-56 overflow-auto rounded border">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(lastReceipt.items || []).map((item, idx) => {
                    const qty = Number(item?.quantity || 0);
                    const price = Number(item?.price || 0);
                    return (
                      <tr key={`${item?.productId || "line"}-${idx}`} className="border-t">
                        <td className="p-2">{item?.name || "Item"}</td>
                        <td className="p-2 text-center">{qty}</td>
                        <td className="p-2 text-right">{toCurrency(price)}</td>
                        <td className="p-2 text-right">{toCurrency(qty * price)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{toCurrency(lastReceipt.subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-{toCurrency(lastReceipt.discount)}</span></div>
              <div className="flex justify-between"><span>Reward</span><span>-{toCurrency(lastReceipt.reward)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{toCurrency(lastReceipt.tax)}</span></div>
              <div className="flex justify-between border-t pt-1 font-bold"><span>Total</span><span>{toCurrency(lastReceipt.total)}</span></div>
              <div className="flex justify-between text-emerald-700 font-semibold"><span>You Saved</span><span>{toCurrency(lastReceipt.totalSavings || 0)}</span></div>
              <div className="flex justify-between"><span>Payment</span><span>{lastReceipt.paymentMethodLabel || "-"}</span></div>
              {lastReceipt.paymentMethod === "cash" && (
                <>
                  <div className="flex justify-between"><span>Cash Tendered</span><span>{toCurrency(lastReceipt.cashTendered)}</span></div>
                  <div className="flex justify-between"><span>Change</span><span>{toCurrency(lastReceipt.changeDue)}</span></div>
                </>
              )}
              <div className="mt-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800">
                {lastReceipt.rewardProgressEligible ? (
                  <>
                    <div className="flex justify-between">
                      <span>Money spent since last reward</span>
                      <span>{toCurrency(lastReceipt.rewardSinceLast || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>To next $20 reward</span>
                      <span>{toCurrency(lastReceipt.rewardToNext || 0)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>Rewards progress</span>
                    <span>N/A</span>
                  </div>
                )}
              </div>
            </div>

            <div
              className="mt-3 rounded border bg-white p-2"
              dangerouslySetInnerHTML={{ __html: buildCode39Svg(lastReceipt.barcodeValue) }}
            />
            <div className="mt-1 text-center text-[11px] text-gray-600">
              Scan barcode to view receipt details
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLastReceipt(null)}
                className="rounded border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const html = buildReceiptPrintHtml(lastReceipt);
                  const printWindow = window.open("", "_blank", "width=420,height=720");
                  if (!printWindow) {
                    setError("Pop-up blocked. Please allow pop-ups to print receipts.");
                    return;
                  }
                  printWindow.document.open();
                  printWindow.document.write(html);
                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                }}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosManagement;
