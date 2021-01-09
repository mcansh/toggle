import postmark from "postmark";

var client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

const makeANiceEmail = (text: string) => `
  <div className="email" style="
    border: 1px solid black;
    padding: 20px;
    font-family: sans-serif;
    line-height: 2;
    font-size: 20px;
  ">
    <h2>Hello There!</h2>
    <p>${text}</p>
    <p>😘, Toggle Team</p>
  </div>
`;

export { client, makeANiceEmail };
