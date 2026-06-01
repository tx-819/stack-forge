import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

interface QueryClientProviderProps {
    children: ReactNode;
}

const QueryClientProvider = ({ children }: QueryClientProviderProps) => {
    return (
        <TanStackQueryClientProvider client={queryClient}>
            {children}
        </TanStackQueryClientProvider>
    );
};

export default QueryClientProvider;

