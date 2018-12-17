const mongo = require('mongodb').MongoClient
const client = require('socket.io').listen(4000).sockets

// Connect to mongo
mongo.connect('mongodb://omar:123asd@ds147964.mlab.com:47964/chat', (err, db) => {
    if(err){
        throw err
    }

    console.log('MongoDB connected...')

    // Connect to Socket.io
    client.on('connection', (socket)=> {
        let chat = db.collection('chats')

        // Create function to send status
        sendStatus = (s) => {
            socket.emit('status', s)
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray((err, res) => {
            if(err){
                throw err
            }

            // Emit the messages
            socket.emit('output', res)
        })

        // Handle input events
        socket.on('input', (data) => {
            let name = data.name
            let message = data.message

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message')
            } else {
                // Insert message
                chat.insert({name: name, message: message}, () => {
                    client.emit('output', [data])

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    })
                })
            }
        })

        // Handle clear
        socket.on('clear', (data) => {
            // Remove all chats from collection
            chat.remove({}, () =>{
                // Emit cleared
                socket.emit('cleared')
            })
        })
    })
})