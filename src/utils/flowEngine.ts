import yaml from 'js-yaml';
import type { FlowDefinition, FlowStep, FormData } from '../types/flow';

export class FlowEngine {
  private flowDefinition: FlowDefinition;
  private currentStepId: string;
  private formData: FormData = {};

  constructor(yamlContent: string) {
    this.flowDefinition = yaml.load(yamlContent) as FlowDefinition;
    this.currentStepId = this.flowDefinition.steps[0]?.id || '';
  }

  getCurrentStep(): FlowStep | undefined {
    return this.flowDefinition.steps.find(step => step.id === this.currentStepId);
  }

  getStepById(id: string): FlowStep | undefined {
    return this.flowDefinition.steps.find(step => step.id === id);
  }

  getAllSteps(): FlowStep[] {
    return this.flowDefinition.steps;
  }

  setCurrentStep(stepId: string): void {
    this.currentStepId = stepId;
  }

  getCurrentStepId(): string {
    return this.currentStepId;
  }

  setFormData(stepId: string, value: any): void {
    this.formData[stepId] = value;
  }

  getFormData(): FormData {
    return this.formData;
  }

  getFormValue(stepId: string): any {
    return this.formData[stepId];
  }

  evaluateCondition(condition: string): boolean {
    try {
      // Simple condition evaluator
      // Replace step references with actual values
      let evaluatedCondition = condition;
      
      // Replace patterns like "stepId.value" with actual values
      const stepReferencePattern = /(\w+)\.value/g;
      evaluatedCondition = evaluatedCondition.replace(stepReferencePattern, (_, stepId) => {
        const value = this.formData[stepId];
        if (typeof value === 'string') {
          return `"${value}"`;
        }
        return String(value);
      });

      // Replace "value" with current step value
      if (evaluatedCondition.includes('value')) {
        const currentValue = this.formData[this.currentStepId];
        if (typeof currentValue === 'string') {
          evaluatedCondition = evaluatedCondition.replace(/\bvalue\b/g, `"${currentValue}"`);
        } else {
          evaluatedCondition = evaluatedCondition.replace(/\bvalue\b/g, String(currentValue));
        }
      }

      // Simple evaluation using Function constructor (be careful in production)
      return new Function('return ' + evaluatedCondition)();
    } catch (error) {
      console.warn('Failed to evaluate condition:', condition, error);
      return false;
    }
  }

  getNextStepId(): string | null {
    const currentStep = this.getCurrentStep();
    if (!currentStep || currentStep.terminate) {
      return null;
    }

    if (!currentStep.next) {
      return null;
    }

    // Handle string next reference
    if (typeof currentStep.next === 'string') {
      return currentStep.next;
    }

    // Handle conditional next array
    if (Array.isArray(currentStep.next)) {
      for (const nextCondition of currentStep.next) {
        if (nextCondition.condition && this.evaluateCondition(nextCondition.condition)) {
          return nextCondition.goto || null;
        }
        if (nextCondition.default) {
          return nextCondition.default;
        }
      }
    }

    return null;
  }

  isStepRequired(): boolean {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return false;

    if (currentStep.required === false) return false;
    if (currentStep.required === true) return true;

    // Check required_when condition
    if (currentStep.required_when) {
      return this.evaluateCondition(currentStep.required_when);
    }

    return false;
  }

  canProceed(): boolean {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return false;

    if (this.isStepRequired()) {
      const value = this.formData[this.currentStepId];
      return value !== undefined && value !== null && value !== '';
    }

    return true;
  }

  proceedToNext(): boolean {
    if (!this.canProceed()) {
      return false;
    }

    const nextStepId = this.getNextStepId();
    if (nextStepId) {
      this.setCurrentStep(nextStepId);
      return true;
    }

    return false;
  }

  getProgress(): number {
    const totalSteps = this.flowDefinition.steps.filter(step => 
      step.type && !step.terminate
    ).length;
    
    const completedSteps = Object.keys(this.formData).length;
    
    return Math.min((completedSteps / totalSteps) * 100, 100);
  }

  reset(): void {
    this.currentStepId = this.flowDefinition.steps[0]?.id || '';
    this.formData = {};
  }
} 