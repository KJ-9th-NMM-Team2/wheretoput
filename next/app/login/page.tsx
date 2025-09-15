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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">

              {/* [09.15] 메인아이콘 자리 */}
              <img src="/asset/wheretoput.png" alt="WheretoPut" className="w-16 h-16" />


            </div>
            {/* <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              로그인
            </h1> */}
          </div>

          <div className="space-y-4">
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
                  className="flex w-full justify-center items-center gap-3 rounded-lg py-3 px-6 bg-black text-white font-bold hover:bg-gray-800 transition-colors tracking-wider focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
                >
                  {provider.id === 'github' && (
                    <VscGithubInverted className="w-5 h-5" />
                  )}
                  {provider.id === 'google' && (
                    <FcGoogle className="w-5 h-5" />
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
