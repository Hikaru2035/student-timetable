import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const client = new LambdaClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });

export async function invokeNotificationLambda(payload) {
  const functionName = process.env.NOTIFICATION_LAMBDA_NAME;
  if (!functionName) {
    throw new Error('NOTIFICATION_LAMBDA_NAME is not configured');
  }

  const response = await client.send(new InvokeCommand({
    FunctionName: functionName,
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify(payload))
  }));

  const decoded = response.Payload ? Buffer.from(response.Payload).toString('utf-8') : '{}';
  const parsed = JSON.parse(decoded || '{}');
  const body = parsed.body ? JSON.parse(parsed.body) : parsed;

  if ((parsed.statusCode && parsed.statusCode >= 400) || response.FunctionError) {
    throw new Error(body.error || response.FunctionError || 'Lambda invocation failed');
  }

  return body;
}
