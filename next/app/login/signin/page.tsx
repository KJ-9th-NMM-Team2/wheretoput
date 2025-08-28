import type { Metadata } from "next";
import SignInForm from "@/components/login/SignInForm";

export const metadata: Metadata = {
  title: "로그인 - 소셜 로그인 데모",
  description: "소셜 계정으로 로그인하세요",
};

export default function SignInPage() {
  return <SignInForm />;
}
