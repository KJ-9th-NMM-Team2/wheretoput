import { redirect } from "next/navigation";
import { signIn, auth, providerMap } from "@/lib/auth";
import { AuthError } from "next-auth";
import { VscGithubInverted } from "react-icons/vsc";
import { FcGoogle } from "react-icons/fc";

const SIGNIN_ERROR_URL = "/error";

export default async function SignInPage(props: {
  searchParams: { callbackUrl: string | undefined };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-sm sm:max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <img
                src="/asset/wheretoput.png"
                alt="WheretoPut"
                className="w-12 h-12 sm:w-16 sm:h-16"
              />
            </div>
            <div>OAuth 로그인 시 서비스별 계정명(구글 이름/깃허브 사용자명)이 사용됩니다.</div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {Object.values(providerMap).map((provider) => (
              <form
                key={provider.id}
                action={async () => {
                  "use server";
                  const params = await props.searchParams;
                  try {
                    await signIn(provider.id, {
                      redirectTo: params?.callbackUrl ?? "",
                    });
                  } catch (error) {
                    if (error instanceof AuthError) {
                      return redirect(
                        `${SIGNIN_ERROR_URL}?error=${error.type}`
                      );
                    }

                    throw error;
                  }
                }}
              >
                <button
                  type="submit"
                  className="flex w-full justify-center items-center gap-2 sm:gap-3 rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 bg-black text-white font-bold hover:bg-gray-800 transition-colors tracking-wider focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer text-sm sm:text-base"
                >
                  {provider.id === 'github' && (
                    <VscGithubInverted className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  {provider.id === 'google' && (
                    <FcGoogle className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span>{provider.name}로 시작하기</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
