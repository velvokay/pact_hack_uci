function currentTimestamp() {
    return Math.round(+new Date() / 1000);
}

function deletePath(path) {
    let updates = {};
    updates[path] = null;

    firebase.database().ref().update(updates);
}

function genericAddData(place, dbKey, postData) {
    postData['timestamp'] = currentTimestamp();

    // Get a key for a new Post.
    var newPostKey = firebase.database().ref().child(dbKey).push().key;

    // Write the new post's data simultaneously in the posts list and the user's post list.
    var updates = {};
    updates['/' + dbKey + '/' + place + '/' + newPostKey] = postData;

    return firebase.database().ref().update(updates);
}

function addBusyRating(place, busy_rating) {
    genericAddData(place, 'busy-ratings', { rating: busy_rating });
}

function addComment(place, user_name, comment) {
    genericAddData(place, 'comments', {
        name: user_name,
        comment: comment
    });
}

/*
 * getAverageBusyRating('placenameorid').then(function(r) {
 *     // r is rating
 * });
 */

function getAverageBusyRating(place) {
    const maxRatingAgeAllowedMinutes = 15; // change this if necessary

    return firebase.database().ref('/busy-ratings/' + place).once('value').then(function(snapshot) {
        const snapshotData = snapshot.val();

        let ratingsSum = 0;
        let numRatings = 0;

        $.each(snapshotData, function (uniqueKey, data) {
            const maxTime = data.timestamp + (maxRatingAgeAllowedMinutes * 60);
            if (currentTimestamp() > maxTime) {
                // delete it, too old of a rating to be relevant
                deletePath('/busy-ratings/' + place + '/' + uniqueKey);
            }
            else {
                ratingsSum += data.rating;
                numRatings++;
            }
        });

        const avgRating = ratingsSum / numRatings;
        if (isNaN(avgRating)) {
            return 0;
        }
        return avgRating;
    });
}

function getComments(place) {
    const maxRatingAgeAllowedDays = 30; // change this if necessary

    return firebase.database().ref('/comments/' + place).once('value').then(function(snapshot) {
        const snapshotData = snapshot.val();
        let commentData = [];

        $.each(snapshotData, function (uniqueKey, data) {
            const maxTime = data.timestamp + (maxRatingAgeAllowedDays * 24 * 60 * 60);
            if (currentTimestamp() > maxTime) {
                // delete it, too old
                deletePath('/comments/' + place + '/' + uniqueKey);
            }
            else {
                commentData.push(data);
            }
        });

        return commentData;
    });
}

/*
Allow unauthenticated access to your database
The simplest workaround for the moment (until the tutorial gets updated) is to go into the Database panel in the console for you project, select the Rules tab and replace the contents with these rules:

{
  "rules": {
    ".read": true,
    ".write": true
  }
}

Original rules:
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
*/