import * as React from 'react';
import { connect } from 'react-redux';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Wizard/wizard';
import {
  Alert,
  Button,
  ButtonVariant,
  WizardContextConsumer,
  WizardStep,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { ALL_VM_WIZARD_TABS, VMWizardTab } from './types';
import {
  hasStepAllRequiredFilled,
  isStepLocked,
  isStepValid,
} from './selectors/immutable/wizard-selectors';
import { iGetCreateVMWizardTabs } from './selectors/immutable/selectors';
import { REVIEW_AND_CREATE } from './strings/strings';

import './create-vm-wizard-footer.scss';

type WizardContext = {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  activeStep: WizardStep;
  goToStepById: (id: number | string) => void;
};
type CreateVMWizardFooterComponentProps = {
  stepData: any;
  createVMText: string;
};

const CreateVMWizardFooterComponent: React.FC<CreateVMWizardFooterComponentProps> = ({
  stepData,
  createVMText,
}) => {
  const [showError, setShowError] = React.useState(false);
  const [prevIsValid, setPrevIsValid] = React.useState(false);

  return (
    <WizardContextConsumer>
      {({ onNext, onBack, onClose, activeStep, goToStepById }: WizardContext) => {
        const activeStepID = activeStep.id as VMWizardTab;
        const isLocked = _.some(ALL_VM_WIZARD_TABS, (id) => isStepLocked(stepData, id));
        const isValid = isStepValid(stepData, activeStepID);

        if (isValid !== prevIsValid) {
          setPrevIsValid(isValid);
          if (isValid) {
            setShowError(false);
          }
        }

        const isFirstStep = activeStepID === VMWizardTab.VM_SETTINGS;
        const isFinishingStep = [VMWizardTab.REVIEW, VMWizardTab.RESULT].includes(activeStepID);
        const isLastStep = activeStepID === VMWizardTab.RESULT;

        const isNextButtonDisabled = isLocked;
        const isBackButtonDisabled = isFirstStep || isLocked;

        return (
          <footer className={css(styles.wizardFooter)}>
            {!isValid && showError && (
              <Alert
                title={
                  hasStepAllRequiredFilled(stepData, activeStepID)
                    ? 'Please correct the invalid fields.'
                    : 'Please fill in all required fields.'
                }
                isInline
                variant="danger"
                className="kubevirt-create-vm-modal__footer-error"
              />
            )}
            {!isLastStep && (
              <Button
                variant={ButtonVariant.primary}
                type="submit"
                onClick={() => {
                  setShowError(!isValid);
                  if (isValid) {
                    onNext();
                  }
                }}
                isDisabled={isNextButtonDisabled}
              >
                {activeStepID === VMWizardTab.REVIEW ? createVMText : 'Next'}
              </Button>
            )}
            {!isFinishingStep && (
              <Button
                variant={ButtonVariant.secondary}
                onClick={() => {
                  const jumpToStepID =
                    (isValid &&
                      !isLocked &&
                      ALL_VM_WIZARD_TABS.find(
                        (stepID) => !isStepValid(stepData, stepID) || stepID === VMWizardTab.REVIEW,
                      )) ||
                    activeStepID;

                  setShowError(jumpToStepID !== VMWizardTab.REVIEW);
                  if (jumpToStepID !== activeStepID) {
                    goToStepById(jumpToStepID);
                  }
                }}
              >
                {REVIEW_AND_CREATE}
              </Button>
            )}
            {!activeStep.hideBackButton && !isLastStep && (
              <Button
                variant={ButtonVariant.secondary}
                onClick={onBack}
                className={css(isBackButtonDisabled && 'pf-m-disabled')}
                isDisabled={isBackButtonDisabled}
              >
                Back
              </Button>
            )}
            {!activeStep.hideCancelButton && (
              <Button variant={ButtonVariant.link} onClick={onClose}>
                Cancel
              </Button>
            )}
          </footer>
        );
      }}
    </WizardContextConsumer>
  );
};

const stateToProps = (state, { wizardReduxId }) => ({
  stepData: iGetCreateVMWizardTabs(state, wizardReduxId),
});

export const CreateVMWizardFooter = connect(stateToProps)(CreateVMWizardFooterComponent);
