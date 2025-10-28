import { useState } from 'react'
import Step1Upload from './steps/Step1Upload'
import Step2Select from './steps/Step2Select'
import { Button } from './components/ui/button'
import type { ChecklistConfig, SelectedEntity } from './types'

function App() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [inputJson, setInputJson] = useState<string | null>(null)
  const [parsedConfig, setParsedConfig] = useState<ChecklistConfig[] | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)

  const handleJsonLoaded = (json: string, parsed: ChecklistConfig[]) => {
    setInputJson(json)
    setParsedConfig(parsed)
  }

  const handleEntitySelected = (entity: SelectedEntity) => {
    setSelectedEntity(entity)
  }

  const canProceed = () => {
    if (currentStep === 1) return inputJson !== null && parsedConfig !== null
    if (currentStep === 2) return selectedEntity !== null
    return true
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            MES Duplication Tool
          </h1>
          <p className="text-muted-foreground mt-2">
            Duplicate stages, tasks, or parameters in manufacturing execution system workflows
          </p>
        </header>

        <div className="bg-card rounded-lg shadow-lg p-6">
          {/* Progress indicator will go here */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${
                    step < 5 ? 'flex-1' : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step === currentStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : step < currentStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 5 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        step < currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Upload</span>
              <span className="text-xs text-muted-foreground">Select</span>
              <span className="text-xs text-muted-foreground">Configure</span>
              <span className="text-xs text-muted-foreground">Preview</span>
              <span className="text-xs text-muted-foreground">Download</span>
            </div>
          </div>

          {/* Main content area */}
          <div className="min-h-[400px]">
            <h2 className="text-xl font-semibold mb-6">
              Step {currentStep}: {
                currentStep === 1 ? 'Upload JSON Configuration' :
                currentStep === 2 ? 'Select Entity to Duplicate' :
                currentStep === 3 ? 'Configure Duplication Options' :
                currentStep === 4 ? 'Preview Changes' :
                'Execute & Download'
              }
            </h2>

            {currentStep === 1 && (
              <Step1Upload onJsonLoaded={handleJsonLoaded} />
            )}

            {currentStep === 2 && parsedConfig && (
              <Step2Select
                config={parsedConfig}
                onEntitySelected={handleEntitySelected}
              />
            )}

            {currentStep > 2 && (
              <div className="text-center text-muted-foreground py-12">
                Step {currentStep} component will be implemented next.
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <Button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as 1 | 2 | 3 | 4 | 5)}
              disabled={currentStep === 1}
              variant="outline"
            >
              ← Back
            </Button>
            <Button
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1) as 1 | 2 | 3 | 4 | 5)}
              disabled={currentStep === 5 || !canProceed()}
            >
              Next →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
