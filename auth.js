const DiscordStrategy  = require('passport-discord').Strategy
const passport = require('passport')
const imgur = require('imgur');
const User = require('./mongo/User')

const getImgurImage = async (userID, avatar) => {
    const uploadLink = `https://cdn.discordapp.com/avatars/${userID}/${avatar}.png?size=256`;
    const upload = await imgur.uploadUrl(uploadLink);
    return upload ?? undefined;
}

passport.serializeUser((user, done) => {
    done(null, user.userID)
})
   
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new DiscordStrategy({
    clientID: '812384167223754802',
    clientSecret: 'NiJ8xVqZ55AwLVBJIa-Se7ntzMg3iuDp',
    callbackURL: `${process.env.HOST}/auth/redirect`,
    scope: ['identify']
}, async (accessToken, refreshToken, profile, done) => {
    const { id: userID, username, avatar} = profile
    const user = await User.findOne({ userID })
    if (!user) {
        const imageNew = await getImgurImage(userID, avatar);
        const schema = new User({ userID, username, avatar, avatarLast: imageNew.link })
        schema.save()
        return done(null, schema)
    } else {
        if (user.username !== username || user.avatar !== avatar) {
            const editUser = await User.findOneAndUpdate({ userID })
            if (user.username !== username) {
                editUser.username = username;
            }
            if (user.avatar !== avatar) {
                const image = await getImgurImage(userID, avatar);
                if (image) {
                    editUser.avatarLast = image.link;
                    editUser.avatar = avatar;
                }
            }
            editUser.save()
            return done(null, editUser)
        }
        return done(null, user)
    }   
}))