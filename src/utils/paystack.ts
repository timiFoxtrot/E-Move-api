import request from "request";

const mySecret: string = `Bearer ${process.env.PAYSTACK_SECRET_KEY}`;
export const initializePayment = (form: any, myCallback: any) => {
  const options = {
    url: "https://api.paystack.co/transaction/initialize",

    headers: {
      authorization: mySecret,
      "content-type": "application/json",
      "cache-control": "no-cache",
    },
    form,
  };

  const callback = (error: any, response: any, body: any) => {
    return myCallback(error, body);
  };

  request.post(options, callback);
};

export const verifyPayment = (ref: string, myCallback: any) => {
  const options = {
    url: `https://api.paystack.co/transaction/verify/${encodeURIComponent(
      ref
    )}`,
    headers: {
      authorization: mySecret,
      "content-type": "application/json",
      "cache-control": "no-cache",
    },
  };

  const callback = (error: any, response: any, body: any) => {
    return myCallback(error, body);
  };
  request(options, callback);
};