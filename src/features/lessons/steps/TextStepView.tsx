import type { TextStep } from '@/content/lessons/types'
import { HandDisplay } from '@/features/quiz/HandDisplay'

export function TextStepView({ step }: { readonly step: TextStep }) {
  return (
    <div className="space-y-5">
      <h2 className="font-mincho text-2xl font-semibold text-gold-300">
        {step.title}
      </h2>
      {step.body.split('\n').map((paragraph, i) => (
        <p key={i} className="text-lg leading-loose">
          {paragraph}
        </p>
      ))}
      {step.tiles !== undefined ? <HandDisplay hand={step.tiles} /> : null}
    </div>
  )
}
