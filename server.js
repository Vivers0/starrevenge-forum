require("dotenv").config()
const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const passport = require('passport')
const path = require('path');
const auth = require('./auth')
const PORT = process.env.PORT || 4000

const User = require('./mongo/User')
const PrivateMessages = require('./mongo/PrivateMessages')
const Categories = require('./mongo/Categories')
const Themes = require('./mongo/Themes')
const Comment = require('./mongo/Comment')
const Token = require('./mongo/Token')
const Link = require("./mongo/Link")
const Topic = require("./mongo/Topic")

// if (process.env.NODE_ENV === 'production') {
//   let root = path.join(__dirname, 'frontend', 'build/')
//   app.use(express.static(root));
// }

app.use(passport.initialize(), passport.authenticate('session'));
app.use(express.json())
app.use(cookieParser())
app.use(cors());

mongoose.connect(`mongodb+srv://savva:2004@cluster0.da8ul.gcp.mongodb.net/starrevenge`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});


const date = () => {
  const now = new Date()
  return now.toLocaleString().split(', ')[0]
}

app.get('/auth', passport.authenticate('discord'))
app.get('/auth/redirect', passport.authenticate('discord', {
    failureRedirect: process.env.HOST + '/404'
}), async function(req, res) {
    let tokenAuth = await Token.findOne({ userID: req.user.userID }) 
    if (tokenAuth) {
      res.cookie('token', tokenAuth.token)
    }
    res.cookie('user', req.user.userID)
    res.redirect(process.env.HOST);
});
app.get('/api/profile/:id', async (req, res) => {
  const userID = req.params.id
  const user = await User.findOne({ userID }).lean();
  if (user) {
    const messages = await PrivateMessages.find({ userID });
    return res.json(Object.assign(user, {messages, response: true}))
  }
  return res.json({});
})
app.post('/message/user/add/:id', async (req, res) => {
  const lastMessage = await PrivateMessages.findOne({}).sort({_id: -1});
  if (lastMessage) {
    const newMessage = new PrivateMessages({
      messageID: lastMessage.messageID+1,
      userID: req.params.id,
      content: req.body.message,
    })
    return newMessage.save().then(() => res.sendStatus(200))
  } else {
    const newMessage = new PrivateMessages({
      messageID: 1,
      userID: req.params.id,
      content: req.body.message,
    })
    return newMessage.save().then(() => res.sendStatus(200))
  }
})
app.delete('/message/delete/:id', async (req, res) => {
  const { id } = req.params
 PrivateMessages.findOneAndRemove({ messageID: id }).then(() => res.status(200).json({}));
})
app.post('/forum/add', async (req, res) => {
  const { name, description, checkbox, parent } = req.body
  const lastCategory = await Categories.findOne({}).sort({_id: -1});
  switch (typeof parent) {
    case 'string':
      if (lastCategory) {
        const categoryChapter = new Categories({
          categoryID: lastCategory.categoryID + 1,
          categoryName: name,
          description,
          isComment: checkbox,
          procreator: {
            chapterName: parent
          }
        });
        categoryChapter.save().then(() => res.json({ id: lastCategory.categoryID + 1}));
      } else {
        const categoryChapter = new Categories({
          categoryID: 1,
          categoryName: name,
          description,
          isComment: checkbox,
          procreator: {
            chapterName: parent
          }
        });
        categoryChapter.save().then(() => res.json({ id: 1}));
      }
    break;
    case 'number':
      const categoryCategory = new Categories({
        categoryID: lastCategory.categoryID + 1,
        categoryName: name,
        description,
        isComment: checkbox,
        procreator: {
          category: parent
        }
      });
      categoryCategory.save().then(() => res.json({ id: lastCategory.categoryID + 1}));
    break;
    default:
      return res.sendStatus(404);
  }
})
app.get('/api/forum/categories/:name', async (req, res) => {
  const { name } = req.params
    const categories = await Categories.find({ "procreator.chapterName": name }).lean();
    for (let i = 0; i < categories.length; i++) {
      let count = 0;
      const categoryID = categories[i].categoryID;
      const parentCategory = await Categories.countDocuments({ "procreator.category": categoryID })
      count += parentCategory;
      const parentLink = await Link.countDocuments({ "procreator.category": categoryID });
      count += parentLink;
      const parentTopic = await Topic.countDocuments({ "procreator": categoryID });
      count += parentTopic;
      categories[i].count = count;
    }
      const links = await Link.find({ "procreator.chapterName": name });
      res.json({ categories, links })
})
app.get('/api/forum/:id', async (req, res) => {
  const { id: categoryID } = req.params
  if (categoryID) {
    const mainCategory = await Categories.findOne({categoryID});
    if (mainCategory) {
      const categories = await Categories.find({ "procreator.category": categoryID }).lean();
      for (let i = 0; i < categories.length; i++) {
        const countCategory = await Categories.countDocuments({ "procreator.category": categories[i].categoryID });
        const countTopic = await Topic.countDocuments({ "procreator": categories[i].categoryID });
        categories[i].count = countCategory + countTopic;
      }
      const links = await Link.find({ "procreator.category": categoryID });
      const topics = await Topic.find({ procreator: categoryID }).lean();
      for (let i = 0; i < topics.length; i++) {
        const countMessages = await Comment.countDocuments({ topicID: topics[i].topicID });
        topics[i].count = countMessages;
      }
      res.json({ mainCategory, categories, links, topics })
    }
  }
    return res.status(404);
})
app.post('/forum/link/create', async (req, res) => {
  const resp = req.body;
  if (resp && resp.link && resp.name && resp.parent) {
    switch (typeof resp.parent) {
      case 'number':
        const linkFromCategory = new Link({
          name: resp.name,
          link: resp.link,
          procreator: {
            category: resp.parent
          }
        });
        return linkFromCategory.save().then(() => res.json({}))
      case 'string':
        const linkFromChapter = new Link({
          name: resp.name,
          link: resp.link,
          procreator: {
            chapterName: resp.parent
          }
        });
        return linkFromChapter.save().then(() => res.json({}))
      default:
        return res.status(404);
    }
  }
  return res.status(400);
})
app.get('/api/forum/themes/:id', async (req, ress) => {
  const { id } = req.params
  let themes = await Themes.find({categoryID: id}).lean()
  for (let i = 0; i < themes.length; i++) {
    themes[i].count = await Comment.countDocuments({ categoryID: id, themeID: themes[i].themeID })
  }
  ress.json({res: themes})
})
app.post('/forum/topic/create', async (req, res) => {
  const resp = req.body
  if (resp && resp.name && resp.content && resp.ownerID && resp.procreator) {
    const lastCommit = await Topic.findOne({}).sort({_id: -1});
    if (lastCommit) {
      const topic = new Topic({
        topicID: lastCommit.topicID + 1,
        date: date(),
        name: resp.name,
        content: resp.content, 
        procreator: resp.procreator, 
        ownerID: resp.ownerID,
        isComment: resp.isComment ?? false
      })
      return topic.save().then(() => res.status(200).json({ id: topic.topicID }));
    } else {
      const topicFirst = new Topic({
        topicID: 1,
        date: date(),
        name: resp.name,
        content: resp.content, 
        procreator: resp.procreator, 
        ownerID: resp.ownerID,
        isComment: resp.isComment
      })
      return topicFirst.save().then(() => res.status(200).json({ id: 1 }));
    }
  }
  return res.status(400).json({})
})
app.get('/api/topic/:id', async (req, res) => {
  const { id } = req.params;
  const topic = await Topic.findOne({ topicID: id }).lean();
  if (topic) {
    const ownerTopic = await User.findOne({ userID: topic.ownerID });
    topic.owner = ownerTopic;
    const comment = await Comment.find({ topicID: id }).lean()
    for (let i = 0; i < comment.length; i++) {
      let user = await User.findOne({ userID: comment[i].userID })
      if (user) {
        comment[i].user = user
      }
    }
    return res.json({topic, comment});
  }
  return res.status(400).json({})
})
app.post('/topic/message/add', async (req, res) => {
  const resp = req.body;
  if (resp && resp.userID && resp.content && resp.topicID) {
    const lastComment = await Topic.findOne({}).sort({_id: -1});
    if (lastComment && lastComment.commentID) {
      const newComment = new Comment({
        commentID: lastComment.commentID + 1,
        topicID: resp.topicID,
        content: resp.content,
        userID: resp.userID
      });
      newComment.save().then(() => res.status(200).json({ id: lastComment.commentID + 1}))
    } else {
      const newComment = new Comment({
        commentID: 1,
        topicID: resp.topicID,
        content: resp.content,
        userID: resp.userID
      });
      return newComment.save().then(() => res.status(200).json({ id: 1 }))
    }
    return res.status(400).json({});
  }
  return res.status(400).json({});
});
app.get('/api/topic/close/:id', async (req, res) => {
  const { id } = req.params
  const topic = await Topic.findOneAndUpdate({ topicID: id });
  if (topic) {
    topic.isClosed = true;
    topic.save().then(() => res.status(200).json({}))
  }
  return res.status(400).json({});
})
app.delete('/topic/delete/:id', async (req, res) => {
  const { id } = req.params
  await Topic.findOneAndRemove({ topicID: id })
  Comment.deleteMany({ topicID: id }).then(() => res.status(200).json({}));
})

if (process.env.NODE_ENV === 'production') {
  const root = path.join(__dirname, 'frontend', 'build/')
  app.use(express.static(root));
  app.get("*", (req, res) => {
    res.sendFile('index.html', { root } );
  })
}

app.listen(PORT, () => {
    console.log("Server is running on Port: " + PORT);
});