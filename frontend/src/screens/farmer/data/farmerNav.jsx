import { IconPaths } from '../../../components/icons'

// activeKey: 'home' | 'myfarms' | 'myanimals' | anything else (no item highlighted)
export function getFarmerNavItems(activeKey, handlers) {
  const {
    onGoHome,
    onGoFarmSetup,
    onGoAnimalSetup,
    onGoMyFarms,
    onGoMyAnimals,
    onGoHealthRecords,
    onGoNotBuilt,
  } = handlers

  return [
    { label: 'Home', icon: IconPaths.grid, active: activeKey === 'home', onClick: onGoHome },
    { label: 'Enroll new farm', icon: IconPaths.plus, onClick: onGoFarmSetup },
    { label: 'Enroll new animal', icon: IconPaths.plus, onClick: onGoAnimalSetup },
    { label: 'My farms', icon: IconPaths.farm, active: activeKey === 'myfarms', onClick: onGoMyFarms },
    { label: 'My animals', icon: IconPaths.animal, active: activeKey === 'myanimals', onClick: onGoMyAnimals },
    { label: 'Sales & transfers', icon: IconPaths.sales, onClick: onGoNotBuilt },
    { label: 'Health & vaccination records', icon: IconPaths.health, onClick: onGoHealthRecords },
    { label: 'Notifications', icon: IconPaths.bell, onClick: onGoNotBuilt },
    { label: 'Settings', icon: IconPaths.gear, onClick: onGoNotBuilt },
  ]
}
