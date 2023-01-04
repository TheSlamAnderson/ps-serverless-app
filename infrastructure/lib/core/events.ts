import * as cdk from '@aws-cdk/core';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as targets from '@aws-cdk/aws-events-targets';
import * as s3 from '@aws-cdk/aws-s3';
import * as events from '@aws-cdk/aws-events';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cloudtrail from '@aws-cdk/aws-cloudtrail';

interface ApplicationEventsProps {
  processingStateMachine: sfn.IStateMachine;
  uploadBucket: s3.IBucket;
}

export class ApplicationEvents extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ApplicationEventsProps) {
    super(scope, id);

    // Trigger Step Function from S3 Upload ------------------------------

    const trail = new cloudtrail.Trail(this, 'CloudTrail', {
      includeGlobalServiceEvents: false,
      isMultiRegionTrail: false,
    });

    trail.addS3EventSelector([{ bucket: props.uploadBucket }], {
      includeManagementEvents: false,
      readWriteType: cloudtrail.ReadWriteType.WRITE_ONLY,
    });

    const uploadRule = props.uploadBucket.onCloudTrailWriteObject('UploadRule', {});

    const stateMachineTarget = new targets.SfnStateMachine(props.processingStateMachine, {});
    uploadRule.addTarget(stateMachineTarget);

    // Custom Event Bus for App ------------------------------------------
    const bus = new events.EventBus(this, 'AppEventBus', {
      eventBusName: 'com.globomantics.dms',
    });
  }
}
