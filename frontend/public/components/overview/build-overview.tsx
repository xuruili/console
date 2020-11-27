import * as _ from 'lodash-es';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SyncAltIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';
import { LogSnippet, Status, StatusIconAndText, BuildConfigOverviewItem } from '@console/shared';
import { BuildNumberLink, BuildLogLink } from '../build';
import { errorModal } from '../modals/error-modal';
import { fromNow } from '../utils/datetime';
import { K8sResourceKind } from '../../module/k8s';
import { BuildConfigModel } from '../../models';
import { BuildPhase, startBuild } from '../../module/k8s/builds';
import { ResourceLink, SidebarSectionHeading, useAccessReview } from '../utils';

const ConjugateBuildPhaseMessage = ({ build }): React.ReactNode => {
  const {
    status: { phase },
  } = build;
  switch (phase) {
    case BuildPhase.Cancelled:
      return (
        <>
          <Trans i18nKey="overview~BuildCancelledPhase">
            Build <BuildNumberLink build={build} /> was cancelled
          </Trans>
        </>
      );
    case BuildPhase.Complete:
      return (
        <>
          <Trans i18nKey="overview~BuildCompletePhase">
            Build <BuildNumberLink build={build} /> is complete
          </Trans>
        </>
      );
    case BuildPhase.Error:
      return (
        <>
          <Trans i18nKey="overview~BuildEncounteredErrorPhase">
            Build <BuildNumberLink build={build} /> encountered an error
          </Trans>
        </>
      );
    case BuildPhase.Failed:
      return (
        <>
          <Trans i18nKey="overview~BuildFailedPhase">
            Build <BuildNumberLink build={build} /> failed
          </Trans>
        </>
      );
    case BuildPhase.Running:
      return (
        <>
          <Trans i18nKey="overview~BuildRunningPhase">
            Build <BuildNumberLink build={build} /> is running
          </Trans>
        </>
      );
    case BuildPhase.Pending:
      return (
        <>
          <Trans i18nKey="overview~BuildPendingPhase">
            Build <BuildNumberLink build={build} /> is pending
          </Trans>
        </>
      );

    default:
      return (
        <>
          <Trans i18nKey="overview~BuildNewPhase">
            Build <BuildNumberLink build={build} /> is new
          </Trans>
        </>
      );
  }
};

const BuildStatus = ({ build }) => {
  const {
    status: { logSnippet, message, phase },
  } = build;
  const unsuccessful = [BuildPhase.Error, BuildPhase.Failed].includes(phase);
  return unsuccessful ? <LogSnippet message={message} logSnippet={logSnippet} /> : null;
};

const BuildOverviewItem: React.SFC<BuildOverviewListItemProps> = ({ build }) => {
  const {
    metadata: { creationTimestamp },
    status: { completionTimestamp, startTimestamp, phase },
  } = build;
  const lastUpdated = completionTimestamp || startTimestamp || creationTimestamp;

  const statusTitle = (
    <div>
      {ConjugateBuildPhaseMessage({ build })}
      {lastUpdated && (
        <>
          {' '}
          <span className="build-overview__item-time text-muted">({fromNow(lastUpdated)})</span>
        </>
      )}
    </div>
  );

  return (
    <li className="list-group-item build-overview__item">
      <div className="build-overview__item-title">
        <div className="build-overview__status co-icon-and-text">
          <div className="co-icon-and-text__icon co-icon-flex-child">
            {phase === 'Running' ? (
              <StatusIconAndText icon={<SyncAltIcon />} title={phase} spin iconOnly />
            ) : (
              <Status status={phase} iconOnly />
            )}
          </div>
          {statusTitle}
        </div>
        <div>
          <BuildLogLink build={build} />
        </div>
      </div>
      <BuildStatus build={build} />
    </li>
  );
};

const BuildOverviewList: React.SFC<BuildOverviewListProps> = ({ buildConfig }) => {
  const {
    metadata: { name, namespace },
    builds,
  } = buildConfig;

  const canStartBuild = useAccessReview({
    group: BuildConfigModel.apiGroup,
    resource: BuildConfigModel.plural,
    subresource: 'instantiate',
    name,
    namespace,
    verb: 'create',
  });

  const onClick = () => {
    startBuild(buildConfig).catch((err) => {
      const error = err.message;
      errorModal({ error });
    });
  };
  const { t } = useTranslation();
  return (
    <ul className="list-group">
      <li className="list-group-item build-overview__item">
        <div className="build-overview__item-title">
          <div>
            <ResourceLink inline kind="BuildConfig" name={name} namespace={namespace} />
          </div>
          {canStartBuild && (
            <div>
              <Button variant="secondary" onClick={onClick}>
                {t('overview~Start Build')}
              </Button>
            </div>
          )}
        </div>
      </li>
      {_.isEmpty(builds) ? (
        <li className="list-group-item">
          <span className="text-muted">{t('overview~No Builds found for this BuildConfig.')}</span>
        </li>
      ) : (
        _.map(builds, (build) => <BuildOverviewItem key={build.metadata.uid} build={build} />)
      )}
    </ul>
  );
};

export const BuildOverview: React.SFC<BuildConfigsOverviewProps> = ({ buildConfigs }) => {
  const { t } = useTranslation();
  if (_.isEmpty(buildConfigs)) {
    return null;
  }

  return (
    <div className="build-overview">
      <SidebarSectionHeading text={t('overview~Builds')} />
      {_.map(buildConfigs, (buildConfig) => (
        <BuildOverviewList key={buildConfig.metadata.uid} buildConfig={buildConfig} />
      ))}
    </div>
  );
};

type BuildOverviewListItemProps = {
  build: K8sResourceKind;
};

type BuildOverviewListProps = {
  buildConfig: BuildConfigOverviewItem;
};

type BuildConfigsOverviewProps = {
  buildConfigs: BuildConfigOverviewItem[];
};
