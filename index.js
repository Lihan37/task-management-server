const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();




const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g9xsrko.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();
        const usersCollection = client.db("taskDb").collection("users");
        const tasksCollection = client.db("taskDb").collection("tasks");

        // tasks
        app.get('/tasks', async (req, res) => {
            const result = await tasksCollection.find().toArray();
            res.send(result);
        });

        app.get('/tasks/:taskId', async (req, res) => {
            try {
                const taskId = new ObjectId(req.params.taskId);

                // Validate taskId to ensure it's a valid ObjectId
                if (!ObjectId.isValid(taskId)) {
                    return res.status(400).json({ error: 'Invalid task ID' });
                }

                // Find the task by ID
                const task = await tasksCollection.findOne({ _id: taskId });

                // Check if the task was found
                if (!task) {
                    return res.status(404).json({ error: 'Task not found' });
                }

                // Send the task in the response
                res.json(task);
            } catch (error) {
                console.error('Error handling task retrieval:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        // Update the POST /tasks endpoint to set the default status to "to-do"
        app.post('/tasks', async (req, res) => {
            try {
                const taskData = req.body;
                // Set the default status to "to-do"
                taskData.status = 'to-do';

                const result = await tasksCollection.insertOne(taskData);

                const insertedTask = await tasksCollection.findOne({ _id: result.insertedId });

                res.status(201).json({ insertedTask });
            } catch (error) {
                console.error('Error handling task creation:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // Update the PUT /tasks/:taskId endpoint to handle only the status update
        app.patch('/tasks/:id', async (req, res) => {
            try {
                const taskId = new ObjectId(req.params.id);
                const { status } = req.body;

                // Validate taskId to ensure it's a valid ObjectId
                if (!ObjectId.isValid(taskId)) {
                    return res.status(400).json({ error: 'Invalid task ID' });
                }

                // Update the task using the ObjectId
                const filter = { _id: taskId };
                const update = { $set: { status } };

                const options = {
                    returnDocument: 'after',
                };

                const updatedTask = await tasksCollection.findOneAndUpdate(filter, update, options);

                res.json({ updatedTask });
            } catch (error) {
                console.error('Error handling task update:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });



       // Update the PATCH /tasks/:taskId endpoint to handle updates
       app.patch('/tasks/:taskId', async (req, res) => {
        try {
          const taskId = req.params.taskId;
      
          if (!ObjectId.isValid(taskId)) {
            return res.status(400).json({ error: 'Invalid task ID' });
          }
      
          const updatedData = req.body;
          const filter = { _id: new ObjectId(taskId) };
      
          // Log the received payload
          console.log('Received Update Payload:', updatedData);
      
          // Log the existing task before the update
          const existingTaskBeforeUpdate = await tasksCollection.findOne(filter);
          console.log('Existing Task Before Update:', existingTaskBeforeUpdate);
      
          // Update all fields using updateOne
          const updateResult = await tasksCollection.updateOne(
            filter,
            {
              $set: updatedData,
            }
          );
      
          // Log the update result
          console.log('Update Result:', updateResult);
      
          // Log the existing task after the update
          const existingTaskAfterUpdate = await tasksCollection.findOne(filter);
          console.log('Existing Task After Update:', existingTaskAfterUpdate);
      
          res.json({ success: true, message: 'Task updated successfully' });
        } catch (error) {
          console.error('Error handling task update:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });
      






        app.delete('/tasks/:taskId', async (req, res) => {
            const taskId = req.params.taskId;

            try {
                console.log('Received delete request for taskId:', taskId);

                // Convert the taskId to an ObjectID
                const objectIdTaskId = new ObjectId(taskId);

                // Delete the task by ID
                const result = await tasksCollection.deleteOne({ _id: objectIdTaskId });

                console.log('Delete result:', result);

                // Check if the deletion was successful
                if (result.deletedCount === 1) {
                    // Send a response indicating success
                    res.json({ success: true });
                } else {
                    res.status(404).json({ error: 'Task not found' });
                }
            } catch (error) {
                console.error('Error handling task deletion:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });



        // users
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        // users
        app.get('/users/:email', async (req, res) => {
            try {
                const userEmail = req.params.email;
                const user = await usersCollection.findOne({ email: userEmail });

                if (user) {
                    res.json(user);
                } else {
                    res.status(404).json({ error: 'User not found' });
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        app.post('/users', async (req, res) => {
            try {
                // Extract user data from the request body
                const userData = req.body;

                // Insert the user data into the MongoDB collection
                const result = await usersCollection.insertOne(userData);

                // Send a response indicating success
                res.status(201).json({ insertedId: result.insertedId });
            } catch (error) {
                console.error('Error handling user registration:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('task management is running')
})

app.listen(port, () => {
    console.log(`task management is on port: ${port}`);
})