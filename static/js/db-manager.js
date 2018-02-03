function currentTimestamp() {
    return Math.round(+new Date() / 1000);
}

function deletePath(path) {
    let updates = {};
    updates[path] = null;

    firebase.database().ref().update(updates);
}

function addBusyRating(place, busy_rating) {
    const timestamp = currentTimestamp();

    const postData = {
        timestamp: timestamp,
        rating: busy_rating
    };

    // Get a key for a new Post.
    var newPostKey = firebase.database().ref().child('busy-ratings').push().key;

    // Write the new post's data simultaneously in the posts list and the user's post list.
    var updates = {};
    updates['/busy-ratings/' + place + '/' + newPostKey] = postData;

    return firebase.database().ref().update(updates);
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

        $.each(snapshotData, function(uniqueKey, data) {
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