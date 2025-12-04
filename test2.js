import { DefaultAzureCredential } from '@azure/identity'
import { AIProjectClient } from '@azure/ai-projects'
import dotenv from 'dotenv'

dotenv.config()

async function invokeWorkflow() {
    const endpoint = process.env.AZURE_EXISTING_AIPROJECT_ENDPOINT || process.env.PROJECT_ENDPOINT

    if (!endpoint) {
        throw new Error('AZURE_EXISTING_AIPROJECT_ENDPOINT or PROJECT_ENDPOINT environment variable is required')
    }

    console.log('Creating AIProjectClient with endpoint:', endpoint)

    const credential = new DefaultAzureCredential()
    const projectClient = new AIProjectClient(endpoint, credential)

    // Debug: Check what's available on projectClient
    console.log('ProjectClient properties:', Object.getOwnPropertyNames(projectClient))
    console.log('ProjectClient prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(projectClient)))

    const workflow = {
        name: 'petetestworkflow01',
        version: '1',
    }
    const agentName = process.env.AZURE_AGENT_NAME || 'petetestworkflow01'

    // Debug: Check what's available on agents
    console.log('Agents properties:', Object.getOwnPropertyNames(projectClient.agents))
    console.log('Agents prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(projectClient.agents)))

    const retrievedworkflow = await projectClient.agents.get(agentName);
    // console.log("Retrieved latest workflow - name:", retrievedworkflow.versions.latest.name, " id:", retrievedworkflow.id);
    // Input: company name and email domain
    const testInput = 'Product Concept: HoloNest. Tagline: Bring your world into focus. Features Adaptive Reality Pods, MoodSync AI, Multi-user layering, zero-lag gesture control, and eco-recharge cells. Target Audience is Create Professional and community organizers.'

    const openaiClient = await projectClient.getOpenAIClient()

    console.log('Creating conversation...')
    const conversation = await openaiClient.conversations.create()
    console.log('Conversation created with ID:', conversation.id)

    const stream = await openaiClient.responses.create({
        conversation: conversation.id,
        input: testInput,
        stream: true,
        metadata: { 'x-ms-debug-mode-enabled': '1' },
        agent: { name: workflow.name, type: 'agent_reference' },
    })

    // Collect stream events and responses
    let responseText = ''
    const workflowActions = []
    const textDeltas = []
    const eventsLog = []

    for await (const event of stream) {
        if (event.type === 'response.output_text.done') {
            responseText += event.text
            eventsLog.push(`Text done: ${event.text}`)
        } else if (event.type === 'response.output_item.added' && event.item?.type === 'workflow_action') {
            const actionInfo = `Actor - '${event.item.action_id}'`
            workflowActions.push(actionInfo)
            eventsLog.push(`********************************\n${actionInfo}`)
        } else if (event.type === 'response.output_item.done' && event.item?.type === 'workflow_action') {
            const actionDone = `Workflow Item '${event.item.action_id}' is '${event.item.status}' - (previous item was: '${event.item.previous_action_id}')`
            workflowActions.push(actionDone)
            eventsLog.push(actionDone)
        } else if (event.type === 'response.output_text.delta') {
            textDeltas.push(event.delta)
            eventsLog.push(`Text delta: ${event.delta}`)
        } else {
            eventsLog.push(`Unknown event: ${JSON.stringify(event)}`)
        }
    }

    await openaiClient.conversations.delete(conversation.id)

    const result = {
        conversation_id: conversation.id,
        response_text: responseText,
        workflow_actions: workflowActions,
        text_deltas: textDeltas,
        events_log: eventsLog,
        conversation_deleted: true,
        status: 'success'
    }

    console.log('\n=== Result ===')
    console.log(JSON.stringify(result, null, 2))

    return result
}

invokeWorkflow()
    .then(() => {
        console.log('\nWorkflow completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\nWorkflow failed:', error)
        process.exit(1)
    })