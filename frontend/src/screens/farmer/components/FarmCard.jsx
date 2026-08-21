import { Icon, IconPaths } from '../../../components/icons'
import { DecryptedText } from '../../../components/reactbits'
import './FarmAnimalCards.css'

export function FarmCard({ farm, animalCount, onViewDetails, onManage }) {
  return (
    <div className="farm-card">
      <div className="farm-card-photo">
        <Icon size={26}>{IconPaths.camera}</Icon>
      </div>
      <div className="farm-card-body">
        <h3 className="farm-card-name">{farm.name}</h3>
        <p className="farm-card-line">
          <Icon size={13}>{IconPaths.route}</Icon>
          {farm.county || 'Location not set'}
        </p>
        <p className="farm-card-line mono">
          <DecryptedText text={farm.id} animateOn="view" speed={30} maxIterations={6} />
        </p>
        <p className="farm-card-line">
          <Icon size={13}>{IconPaths.animal}</Icon>
          {animalCount} {animalCount === 1 ? 'animal' : 'animals'} registered
        </p>
      </div>
      <div className="farm-card-actions">
        <button className="farm-card-btn farm-card-btn-view" onClick={onViewDetails}>
          <Icon size={14}>{IconPaths.search}</Icon>
          View farm details
        </button>
        <button className="farm-card-btn farm-card-btn-manage" onClick={onManage}>
          <Icon size={14}>{IconPaths.edit}</Icon>
          Manage farm
        </button>
      </div>
    </div>
  )
}