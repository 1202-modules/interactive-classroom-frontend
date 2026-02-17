import { useAuthInit } from '@/features/auth/useAuthInit';
import AppRouter from '@/app/AppRouter';

const App = () => {
    useAuthInit();

    return <AppRouter />;
};

export default App;
