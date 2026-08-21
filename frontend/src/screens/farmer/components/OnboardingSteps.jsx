import './OnboardingSteps.css'
import { SplitText } from '../../../components/reactbits'

// steps: [{ label, done, onClick }] — a step is only clickable if the previous
// step is done (or it's the first step). Once a step is done it shows a tick.
export function OnboardingSteps({ steps }) {
  const allDone = steps.every((s) => s.done)

  if (allDone) {
    return (
      <div className="onboard-complete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
        </svg>
        <span>SETUP COMPLETE!</span>
      </div>
    )
  }

  return (
    <div className="onboard-panel">
      <p className="onboard-heading">
        <SplitText tag="span" text="Finish setting up your account" splitType="words" duration={0.4} delay={25} />
      </p>
      <div className="onboard-steps">
        {steps.map((step, i) => {
          const unlocked = i === 0 || steps[i - 1].done
          const state = step.done ? 'done' : unlocked ? 'active' : 'locked'
          const handleClick = () => {
            if (!unlocked || !step.onClick) return
            step.onClick()
          }

          return (
            <div className="onboard-step-wrap" key={step.label}>
              <div className="onboard-item">
                <button
                  type="button"
                  className={`onboard-circle onboard-${state}`}
                  onClick={handleClick}
                  disabled={!unlocked}
                >
                  {step.done ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </button>
                <p className="onboard-label">{step.label}</p>
              </div>
              {i < steps.length - 1 && <div className={`onboard-line${steps[i].done ? ' onboard-line-done' : ''}`}></div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}