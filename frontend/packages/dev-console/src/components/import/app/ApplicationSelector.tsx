import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues, useField } from 'formik';
import { FormGroup, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { InputField, getFieldId, useFormikValidationFix } from '@console/shared';
import {
  CREATE_APPLICATION_KEY,
  CREATE_APPLICATION_LABEL,
  UNASSIGNED_KEY,
  UNASSIGNED_LABEL,
} from '../../../const';
import { sanitizeApplicationValue } from '../../../utils/application-utils';
import ApplicationDropdown from '../../dropdown/ApplicationDropdown';

export interface ApplicationSelectorProps {
  namespace?: string;
  noProjectsAvailable?: boolean;
}

const ApplicationSelector: React.FC<ApplicationSelectorProps> = ({
  namespace,
  noProjectsAvailable,
}) => {
  const { t } = useTranslation();
  const [applicationsAvailable, setApplicationsAvailable] = React.useState(true);
  const availableApplications = React.useRef<string[]>([]);
  const projectsAvailable = !noProjectsAvailable;

  const [selectedKey, { touched, error }] = useField('application.selectedKey');
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [applicationExists, setApplicationExists] = React.useState<boolean>(false);
  const fieldId = getFieldId('application-name', 'dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  useFormikValidationFix(selectedKey.value);

  const onDropdownChange = (key: string, application: string) => {
    setFieldValue('application.selectedKey', key);
    setFieldTouched('application.selectedKey', true);
    setFieldValue('application.name', sanitizeApplicationValue(application, key));
    setFieldTouched('application.name', true);
    setApplicationExists(false);
  };

  const handleOnLoad = (applicationList: { [key: string]: string }) => {
    const noApplicationsAvailable = _.isEmpty(applicationList);
    setApplicationsAvailable(!noApplicationsAvailable);
    availableApplications.current = _.keys(applicationList);
    if (noApplicationsAvailable) {
      setFieldValue('application.selectedKey', '');
      setFieldValue('application.name', '');
    }
  };

  const actionItems = [
    {
      actionTitle: CREATE_APPLICATION_LABEL,
      actionKey: CREATE_APPLICATION_KEY,
    },
    {
      actionTitle: UNASSIGNED_LABEL,
      actionKey: UNASSIGNED_KEY,
    },
  ];

  const handleAppChange = (event) => {
    setApplicationExists(availableApplications.current.includes(event.target.value));
  };

  const inputHelpText = applicationExists
    ? t('devconsole~Warning: the application grouping already exists.')
    : t('devconsole~A unique name given to the application grouping to label your resources.');

  return (
    <>
      {projectsAvailable && applicationsAvailable && (
        <FormGroup
          fieldId={fieldId}
          label={t('devconsole~Application')}
          helperTextInvalid={errorMessage}
          validated={isValid ? 'default' : 'error'}
          helperText={t(
            'devconsole~Select an application for your grouping or {{UNASSIGNED_LABEL}} to not use an application grouping.',
            { UNASSIGNED_LABEL },
          )}
        >
          <ApplicationDropdown
            dropDownClassName="dropdown--full-width"
            menuClassName="dropdown-menu--text-wrap"
            id={fieldId}
            namespace={namespace}
            actionItems={actionItems}
            autoSelect
            selectedKey={selectedKey.value}
            onChange={onDropdownChange}
            onLoad={handleOnLoad}
          />
        </FormGroup>
      )}
      {(!applicationsAvailable || selectedKey.value === CREATE_APPLICATION_KEY) && (
        <InputField
          type={TextInputTypes.text}
          required={selectedKey.value === CREATE_APPLICATION_KEY}
          name="application.name"
          label={t('devconsole~Application Name')}
          data-test-id="application-form-app-input"
          helpText={inputHelpText}
          validated={applicationExists ? ValidatedOptions.warning : ValidatedOptions.default}
          onChange={handleAppChange}
        />
      )}
    </>
  );
};

export default ApplicationSelector;
