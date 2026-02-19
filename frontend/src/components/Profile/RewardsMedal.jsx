import { useId } from "react";

const RewardsMedal = ({ isUnlocked = false, lifetimeSpend = 0, unlockThreshold = 250 }) => {
  const uid = useId().replace(/:/g, "");
  const topPathId = `medal-top-${uid}`;
  const bottomPathId = `medal-bottom-${uid}`;

  const style = isUnlocked
    ? {
        bg: "radial-gradient(circle at 30% 25%, #fff9bf 0%, #d4a017 58%, #8f6a08 100%)",
        ring: "#f6df7f",
        text: "#fffef0",
      }
    : {
        bg: "radial-gradient(circle at 30% 25%, #f0f0f0 0%, #b9b9b9 58%, #7b7b7b 100%)",
        ring: "#dddddd",
        text: "#f5f5f5",
      };

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative h-52 w-52 rounded-full border-4 shadow-[0_18px_35px_rgba(0,0,0,0.28),inset_0_3px_12px_rgba(255,255,255,0.3)]"
        style={{ background: style.bg, borderColor: style.ring }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <path id={topPathId} d="M 24 102 A 76 76 0 0 1 176 102" />
            <path id={bottomPathId} d="M 24 102 A 76 76 0 0 0 176 102" />
          </defs>
          <text
            fill={style.text}
            fontSize="10"
            fontWeight="700"
            letterSpacing="1.2"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          >
            <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">
              QUEEN BEE QUILTS
            </textPath>
          </text>
          <text
            fill={style.text}
            fontSize="10"
            fontWeight="700"
            letterSpacing="1.1"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          >
            <textPath href={`#${bottomPathId}`} startOffset="50%" textAnchor="middle">
              REWARDS PROGRAM
            </textPath>
          </text>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="text-2xl font-black tracking-wide drop-shadow">
            {isUnlocked ? "Unlocked" : "Locked"}
          </div>
          <div className="mt-1 text-xs font-semibold opacity-95">Lifetime Spend</div>
          <div className="text-xl font-bold drop-shadow">${Number(lifetimeSpend || 0).toFixed(2)}</div>
          {!isUnlocked && (
            <div className="mt-1 text-[11px] font-semibold opacity-95">
              Unlocks at ${Number(unlockThreshold || 250).toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardsMedal;
