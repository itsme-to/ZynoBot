module.exports = {
    data: {
        name: 'giveaway',
        description: 'Start, change or stop a giveaway',
        options: [{type: 1, name: 'delete', description: 'Delete a giveaway', options: [{type: 3, name: 'message-id', description: 'The message id of the giveaway', required: true}]}, {type: 1, name: 'end', description: 'End a giveaway', options: [{type: 3, name: 'message-id', description: 'The message id of the giveaway', required: true}]}, {type: 1, name: 'reroll', description: 'Reroll a giveaway', options: [{type: 3, name: 'message-id', description: 'The message id of the giveaway', required: true}, {type: 4, name: 'amount', description: 'The amount of users which should be rerolled', required: false}]}, {type: 1, name: 'start', description: 'Start a giveaway', options: [{type: 3, name: 'prize', description: 'The prize to give', required: true}, {type: 3, name: 'duration', description: 'The duration of the giveaway', required: true}, {type: 10, name: 'winners', description: 'The amount of winners', required: true}, {type: 3, name: 'requirements', description: 'Whether you\'d like to set requirements for the giveaway or not', choices: [{name: 'Yes', value: 'yes'}, {name: 'No', value: 'no'}], required: true}]}],
        category: 'Giveaway',
        permissions: 'ManageMessages',
        defaultEnabled: false,
        visible: false,
        subCommandParent: true
    }
}