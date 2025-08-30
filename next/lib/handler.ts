import { useRouter } from "next/navigation";

export const Handler = () => { 
    const router = useRouter();
    
    return {
        useKeyDown: (inputSearch: string, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                router.push(`/search?q=${encodeURIComponent(inputSearch)}`);
            }
        },
        useClickSearch: (inputSearch: string) => {
            router.push(`/search?q=${encodeURIComponent(inputSearch)}`);
        }
    };
}
