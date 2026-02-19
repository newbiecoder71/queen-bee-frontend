const RewardsProgramPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
      <div className="relative rounded-2xl bg-white px-10 pt-12 pb-10 md:px-14 md:pt-14 md:pb-12 overflow-hidden">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1000 300"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M30,35 C180,8 320,58 470,32 C620,6 770,52 970,30 L970,270 C770,246 620,292 470,268 C320,244 180,292 30,265 Z"
            fill="none"
            stroke="#f5c84c"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="5 10"
          />
          <path
            d="M26,40 C176,13 323,63 474,36 C624,10 772,58 974,35 L974,266 C772,240 624,287 474,263 C323,238 176,286 26,260 Z"
            fill="none"
            stroke="#7a5a00"
            strokeOpacity="0.25"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="2 9"
          />
        </svg>

        <span className="absolute left-6 top-4 h-10 w-10 rounded-full bg-yellow-100 border border-yellow-300 shadow flex items-center justify-center text-2xl" aria-hidden="true">🐝</span>
        <span className="absolute right-6 top-4 h-10 w-10 rounded-full bg-yellow-100 border border-yellow-300 shadow flex items-center justify-center text-2xl" aria-hidden="true">🐝</span>
        <span className="absolute left-6 bottom-4 h-10 w-10 rounded-full bg-yellow-100 border border-yellow-300 shadow flex items-center justify-center text-2xl" aria-hidden="true">🐝</span>
        <span className="absolute right-6 bottom-4 h-10 w-10 rounded-full bg-yellow-100 border border-yellow-300 shadow flex items-center justify-center text-2xl" aria-hidden="true">🐝</span>

        <h1 className="text-3xl md:text-4xl font-bold text-center">Queen Bee Quilts Rewards Program</h1>
        <p className="mt-3 text-gray-700 text-center">
          Earn reward credits based on lifetime purchases and redeem them in store.
        </p>
      </div>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold">How Credits Are Earned</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>- First reward unlocks once lifetime spend reaches $250.</li>
          <li>- After that, earn one additional $20 reward for every extra $250 spent.</li>
          <li>- Reward credits are tracked per customer account and shown in POS when selected.</li>
        </ul>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold">Program Rules</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>- Enrollment is automatic with a customer account.</li>
          <li>- Reward credit value is $20 per credit.</li>
          <li>- Credits can be redeemed at checkout and are tracked as used/unused.</li>
          <li>- Sale items, gift cards, and service-only transactions may be excluded where required.</li>
          <li>- Credits are not redeemable for cash and cannot be transferred between accounts.</li>
          <li>- Rewards, coupons, and rules may be updated by Queen Bee Quilts.</li>
        </ul>
      </section>

      <section className="rounded-2xl border bg-yellow-50 p-6">
        <h2 className="text-xl font-bold">Birthday Bonus</h2>
        <p className="mt-2 text-sm text-gray-700">
          Add your birthday month and day in your profile to unlock birthday offers. Birthday perks
          are available once per year during your birthday month.
        </p>
      </section>
    </div>
  );
};

export default RewardsProgramPage;
