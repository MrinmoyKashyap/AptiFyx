import { Redirect } from 'expo-router';
import { useModeStore } from '../../store/mode-store';
import { ActiveMode } from '@aptifyx/shared-types';

export default function AppLayout() {
  const { currentMode } = useModeStore();

  // Route to the specific mode's folder
  if (currentMode === ActiveMode.CUSTOMER) {
    return <Redirect href="/(app)/(customer)" />;
  } else {
    return <Redirect href="/(app)/(partner)" />;
  }
}
