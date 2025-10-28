import Step1Upload from './steps/Step1Upload'
import Step2Select from './steps/Step2Select'
import Step3Configure from './steps/Step3Configure'
import Step4Preview from './steps/Step4Preview'
import Step5Execute from './steps/Step5Execute'
import { Button } from './components/ui/button'
import { useAppContext } from './contexts/AppContext'

function App() {
  // Use context for all state and actions
  const {
    currentStep,
    parsedConfig,
    selectedEntity,
    duplicationConfig,
    modifiedConfig,
    nextStep,
    previousStep,
    canProceed,
    setJsonLoaded,
    setEntitySelected,
    setConfigUpdated,
    setPreviewGenerated,
    startOver,
    duplicateMore,
  } = useAppContext()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <header className="mb-8" role="banner">
          <h1 className="text-3xl font-bold text-foreground">
            MES Duplication Tool
          </h1>
          <p className="text-muted-foreground mt-2">
            Duplicate stages, tasks, or parameters in manufacturing execution system workflows
          </p>
        </header>

        <div className="bg-card rounded-lg shadow-lg p-6" role="main">
          {/* Progress indicator */}
          <nav aria-label="Progress" className="mb-8">
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
                    aria-current={step === currentStep ? 'step' : undefined}
                    aria-label={`Step ${step}${step === currentStep ? ' (current)' : step < currentStep ? ' (completed)' : ''}`}
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
          </nav>

          {/* Main content area */}
          <div className="min-h-[400px]" role="region" aria-label="Step content">
            <h2 className="text-xl font-semibold mb-6" id="step-heading">
              Step {currentStep}: {
                currentStep === 1 ? 'Upload JSON Configuration' :
                currentStep === 2 ? 'Select Entity to Duplicate' :
                currentStep === 3 ? 'Configure Duplication Options' :
                currentStep === 4 ? 'Preview Changes' :
                'Execute & Download'
              }
            </h2>

            {currentStep === 1 && (
              <Step1Upload onJsonLoaded={setJsonLoaded} />
            )}

            {currentStep === 2 && parsedConfig && (
              <Step2Select
                config={parsedConfig}
                onEntitySelected={setEntitySelected}
              />
            )}

            {currentStep === 3 && selectedEntity && (
              <Step3Configure
                selectedEntity={selectedEntity}
                onConfigUpdated={setConfigUpdated}
              />
            )}

            {currentStep === 4 && parsedConfig && selectedEntity && duplicationConfig && (
              <Step4Preview
                config={parsedConfig}
                selectedEntity={selectedEntity}
                duplicationConfig={duplicationConfig}
                onPreviewGenerated={setPreviewGenerated}
              />
            )}

            {currentStep === 5 && parsedConfig && modifiedConfig && selectedEntity && duplicationConfig && (
              <Step5Execute
                originalConfig={parsedConfig}
                modifiedConfig={modifiedConfig}
                selectedEntity={selectedEntity}
                duplicationConfig={duplicationConfig}
                onStartOver={startOver}
                onDuplicateMore={duplicateMore}
              />
            )}
          </div>

          {/* Navigation buttons */}
          <nav aria-label="Step navigation" className="flex justify-between mt-8">
            <Button
              onClick={previousStep}
              disabled={currentStep === 1}
              variant="outline"
              aria-label={`Go to previous step${currentStep > 1 ? ` (Step ${currentStep - 1})` : ''}`}
            >
              ← Back
            </Button>
            <Button
              onClick={nextStep}
              disabled={currentStep === 5 || !canProceed()}
              aria-label={`Go to next step${currentStep < 5 ? ` (Step ${currentStep + 1})` : ''}`}
            >
              Next →
            </Button>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default App
