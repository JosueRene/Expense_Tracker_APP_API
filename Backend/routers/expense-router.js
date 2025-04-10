const router = require('express').Router()
const Category = require('../models/category-model')
const Expense = require('../models/expense-model')
const authenticationToken = require('../Middlewares/AuthMiddleWare')

router.route('/expenses').get(authenticationToken, (req,res)=> {
    
    const {filter, startDate, endDate} = req.query

    // Build the filter query object to ensure that only the expenses of the logged-in user are retrieved.
    let filterQuery = {userId: req.userId}

    // Apply filters based on the provided filter query parameter
    if (filter === 'past-week') {
        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        filterQuery.createdAt = {$gte: lastWeekDate}
    }

    else if(filter === 'last-month') {
        const firstDayOfLastMonth = new Date();
        firstDayOfLastMonth.setMonth(firstDayOfLastMonth.getMonth() - 1);
        firstDayOfLastMonth.setDate(1);
        filterQuery.createdAt = { $gte: firstDayOfLastMonth };
    }

    else if (filter === 'last-3-months') {
        const lastThreeMonthsDate = new Date();
        lastThreeMonthsDate.setMonth(lastThreeMonthsDate.getMonth() - 3);
        filterQuery.createdAt = { $gte: lastThreeMonthsDate };
    }
    else if (filter === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filterQuery.createdAt = { $gte: start, $lte: end };
    }

    // If no filter is provided, it will simply return all expenses

    Expense.find(filterQuery).then((expenses)=> {
        return res.status(200).json(expenses)
    }).catch((error)=> {
        console.error(error)
        return res.status(500).json({error: message.error})
    })
})

router.route('/expense/add').post(authenticationToken, async(req,res)=> {
    const { category, amount } = req.body

    if(!category || !amount) {
        return res.status(400).json({message: "Missing Fields!" })
    }

    try{

            // Check if Category exists in the collection
            const categoryExist = await Category.findOne({name: category})

            if(!categoryExist) {
                // Add New Category if it doesn't Exist
                await new Category({name: category}).save()
            }

            const NewExpense = new Expense({
                category: category,
                userId: req.userId,
                amount: amount
            })
            
            NewExpense.save().then(()=> {
                console.log("New Expense Added!")
                return res.status(200).json({message: "New Expense Created!"})
            }).catch((error)=> {
                return res.status(400).json({message: "Failed to Add Expense!" + error.message})
            })

    } catch(error){
        console.error(error)
        return res.status(500).json({message: "Internal Server Error!" + error.message})
    }

})


router.route('/expense/:id').get(authenticationToken,(req,res)=> {
    Expense.findById(req.params.id).then((expense)=> {
        if(!expense){
            return res.status(404).json({message: "Task not Found!"})
        }

        if(expense.userId.toString() !== req.userId.toString()){
            return res.status(403).json({message: "You are not authorized to view this expense!"})
        }
        res.status(200).json(expense)

    }).catch((error)=> {
        return res.status(400).json({message: "Error Occured!" + error.message})
    })
})


router.route('/expense/update/:id').post(authenticationToken, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: "Expense not found!" });
        }

        if(expense.userId.toString() !== req.userId.toString()){
            return res.status(403).json({ message: "You are not authorized to update this expense!" })
        }

        // Update expense fields
        expense.category = req.body.category;
        expense.amount = req.body.amount;

        // Check if updated category exists in the collection
        const updatedCategoryExist = await Category.findOne({ name: expense.category });

        if (!updatedCategoryExist) {
            // Add new category if it doesn't exist
            await new Category({ name: expense.category }).save();
        }

        // Save the updated expense
        await expense.save();

        console.log("Expense Updated!");
        return res.status(200).json({ message: "Expense Updated!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred: " + error.message });
    }
});



router.route('/expense/:id').delete(authenticationToken, (req,res)=> {
    Expense.findById(req.params.id).then((expense)=> {
        if(!expense){
            return res.status(404).json({message: "Task not Found!"})
        }

        if(expense.userId.toString() !== req.userId.toString()){
            return res.status(403).json({message: "You are not authorized to view this expense!"})
        }

        expense.deleteOne().then(() => {
            console.log("Expense Deleted!")
            return res.status(200).json({ message: "Expense Deleted!" })
        }).catch(error => res.status(500).json({ error: "Failed to delete Expense!" + error.message}))

    }).catch((error)=> {
        return res.status(400).json({message: "Failed to Delete Expense!" + error.message})
    })
})

module.exports = router