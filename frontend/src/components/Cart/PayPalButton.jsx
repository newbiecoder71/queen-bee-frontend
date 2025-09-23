import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import axios from "axios";

const PayPalButton = ({ amount, checkoutId, onSuccess, onError }) => {
  return (
    <PayPalScriptProvider
      options={{
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
      }}
    >
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              { amount: { value: parseFloat(amount).toFixed(2) } },
            ],
          });
        }}
        onApprove={(data, actions) => {
          return actions.order.capture().then(async (details) => {
            try {
              // ✅ Save payment in backend
              const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/checkouts/${checkoutId}/pay`,
                {
                  paymentStatus: "paid",
                  paymentDetails: details,
                },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                  },
                }
              );

              // ✅ Small delay to let PayPal finish closing its window
              await new Promise((resolve) => setTimeout(resolve, 400));

              // ✅ Only now trigger your success handler (which can dispatch + navigate)
              onSuccess(response.data);

            } catch (err) {
              console.error("Payment save failed:", err);
              onError?.(err);
            }
          });
        }}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;