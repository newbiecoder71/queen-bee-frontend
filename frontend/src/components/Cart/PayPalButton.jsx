import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import axios from "axios";

const paypalEnvironment =
  typeof window !== "undefined" && /(^|\.)queenbeequilts\.com$/i.test(window.location.hostname)
    ? "live"
    : "sandbox";

const PayPalButton = ({ amount, checkoutId, onSuccess, onError }) => {
  return (
    <PayPalScriptProvider
      options={{
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
        intent: "capture",
        currency: "USD",
      }}
    >
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={async () => {
          try {
            const response = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/checkouts/${checkoutId}/paypal-order`,
              {
                paypalEnvironment,
                amount: parseFloat(amount).toFixed(2),
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
              }
            );

            return response.data.orderId;
          } catch (error) {
            onError?.(error);
            throw error;
          }
        }}
        onApprove={async (data) => {
          try {
            const response = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/checkouts/${checkoutId}/paypal-capture`,
              {
                orderId: data.orderID,
                paypalEnvironment,
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
              }
            );

            await new Promise((resolve) => setTimeout(resolve, 400));
            onSuccess(response.data);
          } catch (error) {
            console.error("PayPal capture failed:", error);
            onError?.(error);
            throw error;
          }
        }}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;
