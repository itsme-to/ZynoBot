module.exports = {
    data: {
        name: 'poll',
        description: 'Start, change or stop a poll',
        options: [{type: 1, name: 'delete', description: 'Delete a poll', options: [{type: 3, name: 'message-id', description: 'The message id of the poll', required: true}]}, {type: 1, name: 'end', description: 'End a poll', options: [{type: 3, name: 'message-id', description: 'The message id of the poll', required: true}]}, {type: 1, name: 'start', description: 'Start a poll', options: [{type: 3, name: 'question', description: 'The question of the poll', required: true}, {type: 3, name: 'duration', description: 'The duration of the poll', required: true}]}, {type: 1, name: 'overview', description: 'Get an overview of all the active polls'}],
        category: 'Polls',
        permissions: 'ManageMessages',
        defaultEnabled: false,
        visible: false,
        subCommandParent: true
    }
}