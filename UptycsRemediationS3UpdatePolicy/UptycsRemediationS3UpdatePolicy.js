'use strict';
const { S3Client, PutBucketPolicyCommand, GetBucketPolicyCommand } = require('@aws-sdk/client-s3');
const { sendToUptycsRemediationFeedback, ApplicationError } = require('../utils');

/**
 *  Block S3 from Public access
 * @param {object} event
 * @param {object} context
 * @param {object} callback
 * @returns
 */
module.exports.handler = async (event, context, callback) => {
  event = event || {};
  try {
    console.log(' Update S3 bucket policy  - Received event:', JSON.stringify(event, null, 2));
    event.lambdaExecutorRecievedTime = new Date();
    if (!event.region) {
      throw new ApplicationError('Invalid event, no region provided');
    }
    const responses = [];
    const client = new S3Client({ region: event.region });
    let existingPolicy = true;
    let getBucketPolicyResponse = {};
    const getBucketPolicyInput = {
      Bucket: event.bucketName,
    };
    //To handle case where bucket policy is empty
    try {
      console.log('Running get S3 bucket policy for input:', JSON.stringify(getBucketPolicyInput, null, 2));
      const getBucketPolicycommand = new GetBucketPolicyCommand(getBucketPolicyInput);
      getBucketPolicyResponse = await client.send(getBucketPolicycommand);
      responses.push(getBucketPolicyResponse);
      console.log(
        'Done running get S3 bucket policy - Received response',
        JSON.stringify(getBucketPolicyResponse, null, 2)
      );
    } catch (err) {
      existingPolicy = false;
    }
    const s3Arn = 'arn:aws:s3:::' + event.bucketName + '/*';
    const addPolicy = {
      Effect: 'Deny',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: s3Arn,
      Condition: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    };
    let finalPolicy = '';
    if (existingPolicy) {
      const parsedPolicy = JSON.parse(getBucketPolicyResponse.Policy);
      parsedPolicy.Statement.push(addPolicy);
      finalPolicy = JSON.stringify(parsedPolicy);
    } else {
      finalPolicy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [addPolicy],
      });
    }
    console.log(finalPolicy);
    const updateBucketPolicyInput = {
      Bucket: event.bucketName,
      Policy: finalPolicy,
    };
    console.log('Running update S3 bucket policy for input:', JSON.stringify(updateBucketPolicyInput, null, 2));
    //PUT BUCKET POLICY
    const putBucketPolicyCommand = new PutBucketPolicyCommand(updateBucketPolicyInput);
    const putBucketPolicyResponse = await client.send(putBucketPolicyCommand);
    responses.push(putBucketPolicyResponse);
    console.log(
      'Done running update S3 bucket policy - Received response',
      JSON.stringify(putBucketPolicyResponse, null, 2)
    );
    const resp = Object.assign({}, responses);
    event.response = resp || {};
  } catch (err) {
    event.error = err;
    console.error('Error : ', err.message);
  } finally {
    event.lambdaFeedbackDispachedTime = new Date();
    await sendToUptycsRemediationFeedback(event);
  }
};
