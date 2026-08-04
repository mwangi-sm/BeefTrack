import { Icon, IconPaths } from '../../../components/icons'
import './FarmAnimalCards.css'

export function AnimalCard({ animal, farmName, onOpenDetails }) {
  return (
    <div className="animal-card">
      <div className="animal-card-photo">
        <Icon size={22}>{IconPaths.animal}</Icon>
      </div>
      <div className="animal-card-body">
        <button className="animal-card-id" onClick={onOpenDetails}>{animal.id}</button>
        <p className="animal-card-line mono">{animal.rfid}</p>
        <p className="animal-card-line">{animal.breed || 'Breed not recorded'}</p>
        {farmName && <p className="animal-card-farm">{farmName}</p>}
      </div>
    </div>
  )
}
