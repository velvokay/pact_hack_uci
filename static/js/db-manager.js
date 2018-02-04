function currentTimestamp() {
    return Math.round(+new Date() / 1000);
}

function deletePath(path) {
    let updates = {};
    updates[path] = null;

    firebase.database().ref().update(updates);
}

function genericAddData(place, dbKey, postData, presetPostKey = null, addTimestamp = true) {
    if (addTimestamp) {
        postData['timestamp'] = currentTimestamp();
    }

    // Get a key for a new Post.
    var newPostKey = firebase.database().ref().child(dbKey).push().key;
    if (presetPostKey != null) {
        newPostKey = presetPostKey;
    }

    // Write the new post's data simultaneously in the posts list and the user's post list.
    var updates = {};
    updates['/' + dbKey + '/' + place + '/' + newPostKey] = postData;

    return firebase.database().ref().update(updates);
}

function addBusyRating(place, busy_rating) {
    genericAddData(place, 'busy-ratings', { rating: busy_rating });
}

/*
tags should be structured like:
{
    quiet: true,
    loud: false,
    ac: false,
    heat: false,
    pet_friendly: false,
    outdoor_seating: false
}
*/
function addTags(place, tags) {
    $.each(tags, function(tag, value) {
        if (value) {
            genericAddData(place, 'tags', value, tag, false);
        }
    });
}

/*
 * getAverageBusyRating('placenameorid').then(function(r) {
 *     // r is rating
 * });
 */

function getAverageBusyRating(place) {
    const maxRatingAgeAllowedMinutes = 30; // change this if necessary

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

/*
Example call:

getTags('test-place-id').then(function(tagsData) {
    console.log(tagsData);
});

returns an object similar to baseTagsValues variable below but with values properly set
*/
function getTags(place) {
    let baseTagsValues = {
        quiet: false,
        loud: false,
        ac: false,
        heat: false,
        pet_friendly: false,
        outdoor_seating: false
    };

    return firebase.database().ref('/tags/' + place).once('value').then(function(snapshot) {
        const snapshotData = snapshot.val();

        $.each(snapshotData, function (tag, value) {
            baseTagsValues[tag] = value;
        });

        return baseTagsValues;
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