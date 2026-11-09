"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/login/actions";
import styles from "./login.module.css";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className={styles.form}>
      <label htmlFor="loginId">Identitas login</label>
      <input id="loginId" name="loginId" placeholder="Username atau email" autoComplete="username" required minLength={3} />

      <label htmlFor="password">Kata sandi</label>
      <input id="password" type="password" name="password" placeholder="Masukkan kata sandi" autoComplete="current-password" required />

      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Memeriksa akun…" : "Masuk"}</button>
    </form>
  );
}
