import { Icon, IconPaths } from '../../../components/icons'
import { DecryptedText } from '../../../components/reactbits'
import './FarmAnimalCards.css'

export function AnimalCard({ animal, farmName, onOpenDetails }) {
  return (
    <div className="animal-card">
      <div className="animal-card-photo">
        <Icon size={22}>{IconPaths.animal}</Icon>
      </div>
      <div className="animal-card-body">
        <button className="animal-card-id" onClick={onOpenDetails}>
          <DecryptedText text={animal.id} animateOn="view" speed={30} maxIterations={6} monospace={false} />
        </button>
        <p className="animal-card-line mono">{animal.rfid}</p>
        <p className="animal-card-line">{animal.breed || 'Breed not recorded'}</p>
        {farmName && <p className="animal-card-farm">{farmName}</p>}
      </div>
    </div>
  )
}