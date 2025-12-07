
import Allroutes from './components/allRoutes/Allroutes';
import NotificationProvider from './components/nofication/Nofication';

function App() {
  return (
    <NotificationProvider>
      <Allroutes/>
    </NotificationProvider>
  );
}

export default App;
