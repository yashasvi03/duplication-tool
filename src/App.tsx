import { useState } from 'react'
import Step1Upload from './steps/Step1Upload'
import Step2Select from './steps/Step2Select'
import Step3Configure from './steps/Step3Configure'
import Step4Preview from './steps/Step4Preview'
import Step5Execute from './steps/Step5Execute'
import { Button } from './components/ui/button'
import type { ChecklistConfig, SelectedEntity, DuplicationConfig } from './types'

function App() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [inputJson, setInputJson] = useState<string | null>(null)
  const [parsedConfig, setParsedConfig] = useState<ChecklistConfig[] | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)
  const [duplicationConfig, setDuplicationConfig] = useState<DuplicationConfig | null>(null)
  const [modifiedConfig, setModifiedConfig] = useState<ChecklistConfig[] | null>(null)

  const handleJsonLoaded = (json: string, parsed: ChecklistConfig[]) => {
    setInputJson(json)
    setParsedConfig(parsed)
  }

  const handleEntitySelected = (entity: SelectedEntity) => {
    setSelectedEntity(entity)
  }

  const handleConfigUpdated = (config: DuplicationConfig) => {
    setDuplicationConfig(config)
  }

  const handlePreviewGenerated = (modified: ChecklistConfig[]) => {
    setModifiedConfig(modified)
  }

  const handleStartOver = () => {
    setCurrentStep(1)
    setInputJson(null)
    setParsedConfig(null)
    setSelectedEntity(null)
    setDuplicationConfig(null)
    setModifiedConfig(null)
  }

  const handleDuplicateMore = () => {
    setCurrentStep(2)
    setSelectedEntity(null)
    setDuplicationConfig(null)
    setModifiedConfig(null)
  }

  const canProceed = () => {
    if (currentStep === 1) return inputJson !== null && parsedConfig !== null
    if (currentStep === 2) return selectedEntity !== null
    if (currentStep === 3) return duplicationConfig !== null
    if (currentStep === 4) return modifiedConfig !== null
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

            {currentStep === 3 && selectedEntity && (
              <Step3Configure
                selectedEntity={selectedEntity}
                onConfigUpdated={handleConfigUpdated}
              />
            )}

            {currentStep === 4 && parsedConfig && selectedEntity && duplicationConfig && (
              <Step4Preview
                config={parsedConfig}
                selectedEntity={selectedEntity}
                duplicationConfig={duplicationConfig}
                onPreviewGenerated={handlePreviewGenerated}
              />
            )}

            {currentStep === 5 && parsedConfig && modifiedConfig && selectedEntity && duplicationConfig && (
              <Step5Execute
                originalConfig={parsedConfig}
                modifiedConfig={modifiedConfig}
                selectedEntity={selectedEntity}
                duplicationConfig={duplicationConfig}
                onStartOver={handleStartOver}
                onDuplicateMore={handleDuplicateMore}
              />
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
