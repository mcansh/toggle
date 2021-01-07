import * as React from "react";
import { Form, usePendingFormSubmit } from "@remix-run/react";

export function meta() {
  return {
    title: "Register | Remix Starter",
    description: "Welcome to remix!",
  };
}

const inputStyles: React.CSSProperties = {
  borderRadius: "0.25rem",
  appearance: "none",
  border: "2px solid black",
  marginBottom: "0.25rem",
  fontSize: "1rem",
  padding: "4px 10px",
};

export default function Register() {
  const pendingForm = usePendingFormSubmit();
  return (
    <div>
      <Form method="post" action="/register">
        <fieldset
          disabled={!!pendingForm}
          style={{
            display: "flex",
            flexDirection: "column",
            margin: 0,
            padding: 0,
            border: "none",
          }}
        >
          <input
            type="text"
            autoComplete="name"
            placeholder="name"
            name="name"
            style={inputStyles}
          />
          <input
            type="email"
            autoComplete="email"
            placeholder="email"
            name="email"
            style={inputStyles}
          />
          <input
            type="text"
            autoComplete="username"
            placeholder="username"
            name="username"
            style={inputStyles}
          />
          <button type="submit" style={{ fontSize: "1rem" }}>
            Register
          </button>
        </fieldset>
      </Form>
    </div>
  );
}
