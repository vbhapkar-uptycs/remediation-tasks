"use strict";
const {
  S3Client,
  PutBucketPolicyCommand,
  GetBucketPolicyCommand,
} = require("@aws-sdk/client-s3");
const {
  sendToUptycsRemediationFeedback,
  ApplicationError,
} = require("../utils");

/**
 *  Block S3 from Public access
 * @param {object} event
 * @param {object} context
 * @param {object} callback
 * @returns
 */
module.exports.handler = async (event, context, callback) => {
  event = event || {};

  console.log(
    " Block S3 Public Access  - Received event:",
    JSON.stringify(event, null, 2)
  );
  try {
    if (!event.region) {
      throw new ApplicationError("Invalid event, no region provided");
    }
    event.lambdaExecutorRecievedTime = new Date();

    const client = new S3Client({ region: event.region });

    const input = ""; //bucket name;

    // GET BUCKET POLICY
    const command = new GetBucketPolicyCommand(input);
    const policy = await client.send(command);
    event.response = policy;
    
    if (!event.response) {
        throw new ApplicationError("Invalid bucket name");
    }
    
    // response will be policy in string format
    policy = JSON.parse(policy);

    //adderPolicy is policy which will get added to the existing bucket
    adderPolicy.Resource = adderPolicy.Resource.replace("<bucket_name>", input); 
    policy.Statement.push(adderPolicy);
    

    policy = JSON.stringify(policy);
    
    // PUT BUCKET POLICY
    const putCommand = new PutBucketPolicyCommand(policy);
    const putResponse = await client.send(putCommand);
    console.log(putResponse);
  } catch (err) {
    event.error = err;
    console.error("Error : ", err.message);
  } finally {
    event.lambdaFeedbackDispachedTime = new Date();
    await sendToUptycsRemediationFeedback(event);
  }
};
