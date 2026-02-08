import { useAuthInit } from './hooks/useAuthInit';
import TemplateApp from './template/TemplateApp';

const App = () => {
    useAuthInit();

    return <TemplateApp />;
};

export default App;
