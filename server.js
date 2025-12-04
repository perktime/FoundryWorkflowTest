import express from 'express';
import { DefaultAzureCredential } from '@azure/identity';
import { AIProjectClient } from '@azure/ai-projects';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
console.log('✅ Environment variables loaded');
console.log('🔗 AZURE_EXISTING_AIPROJECT_ENDPOINT:', process.env.AZURE_EXISTING_AIPROJECT_ENDPOINT ? 'SET' : 'NOT SET');

const app = express();
const port = process.env.PORT || 3000;
console.log('🚀 Initializing Express app on port:', port);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main workflow endpoint
app.post('/api/workflow', async (req, res) => {
    console.log('🔄 Workflow API called');
    try {
        const { input } = req.body;
        
        if (!input) {
            console.log('❌ No input provided');
            return res.status(400).json({ error: 'Input is required' });
        }

        console.log('🚀 Starting workflow execution...');
        const result = await invokeWorkflow(input);
        console.log('✅ Workflow completed successfully');
        res.json(result);
    } catch (error) {
        console.error('❌ Workflow failed:', error.message);
        console.error('Full error:', error);
        res.status(500).json({ 
            error: 'Workflow execution failed', 
            message: error.message 
        });
    }
});

async function invokeWorkflow(testInput) {
    console.log('🔄 Starting workflow with input:', testInput.substring(0, 50) + '...');
    const endpoint = process.env.AZURE_EXISTING_AIPROJECT_ENDPOINT || process.env.PROJECT_ENDPOINT;

    if (!endpoint) {
        throw new Error('AZURE_EXISTING_AIPROJECT_ENDPOINT or PROJECT_ENDPOINT environment variable is required');
    }

    console.log('🔗 Creating AIProjectClient with endpoint:', endpoint);

    const credential = new DefaultAzureCredential();
    const projectClient = new AIProjectClient(endpoint, credential);

    const workflow = {
        name: 'petetestworkflow01',
        version: '1',
    };
    const agentName = process.env.AZURE_AGENT_NAME || 'petetestworkflow01';

    const retrievedworkflow = await projectClient.agents.get(agentName);
    
    const openaiClient = await projectClient.getOpenAIClient();

    console.log('Creating conversation...');
    const conversation = await openaiClient.conversations.create();
    console.log('Conversation created with ID:', conversation.id);

    const stream = await openaiClient.responses.create({
        conversation: conversation.id,
        input: testInput,
        stream: true,
        metadata: { 'x-ms-debug-mode-enabled': '1' },
        agent: { name: workflow.name, type: 'agent_reference' },
    });

    // Collect stream events and responses
    let responseText = '';
    const workflowActions = [];
    const textDeltas = [];
    const eventsLog = [];

    for await (const event of stream) {
        if (event.type === 'response.output_text.done') {
            responseText += event.text;
            eventsLog.push(`Text done: ${event.text}`);
        } else if (event.type === 'response.output_item.added' && event.item?.type === 'workflow_action') {
            const actionInfo = `Actor - '${event.item.action_id}'`;
            workflowActions.push(actionInfo);
            eventsLog.push(`********************************\n${actionInfo}`);
        } else if (event.type === 'response.output_item.done' && event.item?.type === 'workflow_action') {
            const actionDone = `Workflow Item '${event.item.action_id}' is '${event.item.status}' - (previous item was: '${event.item.previous_action_id}')`;
            workflowActions.push(actionDone);
            eventsLog.push(actionDone);
        } else if (event.type === 'response.output_text.delta') {
            textDeltas.push(event.delta);
            eventsLog.push(`Text delta: ${event.delta}`);
        } else {
            eventsLog.push(`Unknown event: ${JSON.stringify(event)}`);
        }
    }

    await openaiClient.conversations.delete(conversation.id);

    const result = {
        conversation_id: conversation.id,
        response_text: responseText,
        workflow_actions: workflowActions,
        text_deltas: textDeltas,
        events_log: eventsLog,
        conversation_deleted: true,
        status: 'success'
    };

    console.log('\n=== Result ===');
    console.log(JSON.stringify(result, null, 2));

    return result;
}

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Workflow API: POST http://localhost:${port}/api/workflow`);
});