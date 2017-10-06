const chai = require('chai')
const chaiHttp = require('chai-http')
const {app, runServer, closeServer} = require('../server')

// use *should* style syntax in our chai tests
const should = chai.should()

// make HTTP requests in tests
chai.use(chaiHttp)

describe('Recipes', function () {

  // Before our tests run, we activate the server. Our `runServer`
  // function returns a promise, and we return that promise by
  // doing `return runServer`. Prevents tests from starting too early.
  before(function () {
    return runServer()
  })

  // close our server at the end of these tests.
  after(function () {
    return closeServer()
  })

  // for Mocha tests, when we're dealing with asynchronous operations,
  // we must either return a Promise object or else call a `done` callback
  // at the end of the test. The `chai.request(app).get...` call is asynchronous
  // and returns a Promise so .then() can be used to make sure the test is complete
  // before returning a response.

  //   1. make a GET request to `/recipes`
  //   2. inspect response object and prove it has the right status code
  //   and right keys in the response object.
  it('should list recipes on GET', function () {

    return chai.request(app)
      .get('/recipes')
      .then(function (res) {
        res.should.have.status(200)
        res.should.be.json
        res.body.should.be.a('array')
        // because we create two items on app load
        res.body.length.should.be.at.least(1)
        // each item should be an object with key/value pairs
        // for `id`, `name` and `ingredients`.
        res.body.forEach(function (item) {
          item.should.be.a('object')
          item.should.include.all.keys('id', 'name', 'ingredients')
        })
        // resolve promise
        return Promise.resolve()
      })
  })

  //  1. make a POST request with data for a new item
  //  2. inspect response object and prove it has right
  //  status code and that the returned object has an `id`
  it('should add recipe on POST', function () {
    const newItem = {name: 'hot tea', ingredients: ['tea bag', 'hot water', 'honey']}
    return chai.request(app)
      .post('/recipes')
      .send(newItem)
      .then(function (res) {
        res.should.have.status(201)
        res.should.be.json
        res.body.should.be.a('object')
        res.body.should.include.keys('id', 'name', 'ingredients')
        res.body.id.should.not.be.null
        // response should be deep equal to `newItem` from above if we assign
        // `id` to it from `res.body.id`
        res.body.should.deep.equal(Object.assign(newItem, {id: res.body.id}))
        // resolve promise
        return Promise.resolve()
      })
  })

  //  1. initialize some update data (we won't have an `id` yet)
  //  2. make a GET request so we can get an item to update
  //  3. add the `id` to `updateData`
  //  4. Make a PUT request with `updateData`
  //  5. Inspect the response object to ensure it
  //  has right status code and that we get back an updated
  //  item with the right data in it.
  it('should update a recipe on PUT', function () {
    // we initialize our updateData here and then after the initial
    // request to the app, we update it with an `id` property so
    // we can make a second, PUT call to the app.
    const updateData = {
      name: 'fruit salad',
      ingredients: ['apples', 'grapes', 'strawberries', 'oranges']
    }

    return chai.request(app)
      // get recipes so we have access to an id
      .get('/recipes')
      .then(function (res) {
        updateData.id = res.body[0].id
        // this will return a promise whose value will be the response
        // object, which we can inspect in the next `then` block.
        return chai.request(app)
          .put(`/recipes/${updateData.id}`)
          .send(updateData)
      })
      // prove that the PUT request has right status code
      .then(function (res) {
        res.should.have.status(204)
        // resolve promise
        return Promise.resolve()
      })
  })

  //  1. GET recipe items so we can get the ID of one to delete.
  //  2. DELETE an item using the ID and ensure we get back a status 204
  it('should delete recipe on DELETE', function () {
    return chai.request(app)
      // get recipes so we have access to an id
      .get('/recipes')
      .then(function (res) {
        return chai.request(app)
          .delete(`/recipes/${res.body[0].id}`)
      })
      .then(function (res) {
        res.should.have.status(204)
        // resolve promise
        return Promise.resolve()
      })
  })

  // edge case - POST request missing name
  //  1. make a POST request without name
  //  2. inspect response, should have message with name
  it('should receive error message for POST request without name', function () {
    const newItem = {ingredients: ['tea bag', 'hot water', 'honey']}
    return chai.request(app)
      .post('/recipes')
      .send(newItem)
      .catch(function (err) {
        err.should.have.status(400)
        err.response.error.text.should.be.a('string').that.includes('name')

        // resolve promise
        return Promise.resolve()
      })
  })
})
