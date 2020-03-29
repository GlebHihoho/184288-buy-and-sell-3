'use strict';

const fs = require(`fs`).promises;
const {Router} = require(`express`);
const nanoid = require(`nanoid`);
const get = require(`lodash/get`);
const find = require(`lodash/find`);
const findIndex = require(`lodash/findIndex`);

const {HTTP_CODE} = require(`../../../constants`);

const offersRoute = new Router();

const FILE_NAME = `mocks.json`;

const offerFields = [`title`, `picture`, `description`, `type`, `sum`, `сategory`, `comments`];

const readMocks = async () => {
  try {
    const fileContent = await fs.readFile(FILE_NAME);
    const mocks = JSON.parse(fileContent);

    return mocks;
  } catch (err) {
    return [];
  }
};

offersRoute.get(`/`, async (req, res) => {
  const offers = await readMocks();

  return res.send(offers);
});

offersRoute.post(`/`, async (req, res) => {
  const offer = req.body;
  const offerKeys = Object.keys(offer);
  const isValid = offerFields.every((field) => offerKeys.includes(field));

  if (isValid) {
    const offers = await readMocks();
    offers.push({...offer, id: nanoid(6)});
    const preparedOffers = JSON.stringify(offers, null, `  `);

    try {
      await fs.writeFile(FILE_NAME, preparedOffers);
      return res.send(offer);
    } catch (error) {
      return res.status(HTTP_CODE.INTERNAL_SERVER_ERROR).send(`Something went wrong`);
    }
  }

  return res.status(HTTP_CODE.NOT_FOUND).send(`Something went wrong`);
});

offersRoute.put(`/:offerId`, async (req, res) => {
  const id = req.params.offerId;
  const offerData = req.body;
  const offers = await readMocks();
  const offer = find(offers, [`id`, id]);
  const offerIndex = findIndex(offers, [`id`, id]);

  if (!offer) {
    return res.status(HTTP_CODE.NOT_FOUND).send(`Offer not found`);
  }

  try {
    offers[offerIndex] = offerData;
    const preparedOffers = JSON.stringify(offers, null, `  `);
    await fs.writeFile(FILE_NAME, preparedOffers);
    return res.send(offer);
  } catch (error) {
    return res.status(HTTP_CODE.INTERNAL_SERVER_ERROR).send(`Something went wrong`);
  }
});

offersRoute.get(`/:offerId`, async (req, res) => {
  const offers = await readMocks();
  const id = req.params.offerId;
  const offer = find(offers, [`id`, id]);

  return res.send(offer);
});

offersRoute.delete(`/:offerId`, async (req, res) => {
  const offers = await readMocks();
  const id = req.params.offerId;
  const offer = find(offers, [`id`, id]);
  const filteredOffers = offers.filter((item) => item.id !== id);
  const preparedOffers = JSON.stringify(filteredOffers, null, `  `);

  if (!offer) {
    return res.status(HTTP_CODE.NOT_FOUND).send(`Offer not found`);
  }

  try {
    await fs.writeFile(FILE_NAME, preparedOffers);
  } catch (error) {
    return res.status(HTTP_CODE.INTERNAL_SERVER_ERROR).send(`Something went wrong`);
  }

  return res.send(offer);
});

offersRoute.get(`/:offerId/comments`, async (req, res) => {
  const offers = await readMocks();
  const id = req.params.offerId;
  const offer = find(offers, [`id`, id]);
  const comments = get(offer, `comments`);

  return res.send(comments);
});

offersRoute.delete(`/:offerId/comments/:commentId`, async (req, res) => {
  const offerId = req.params.offerId;
  const commentId = req.params.commentId;

  const offers = await readMocks();
  const offer = find(offers, [`id`, offerId]);
  const comment = find((offer.comments, [`id`, commentId]));
  const offerIndex = findIndex(offers, [`id`, offerId]);

  if (!offer && !comment) {
    return res.status(HTTP_CODE.NOT_FOUND).send(`Offer not found`);
  }

  try {
    offer.comments = offer.comments.filter((item) => item.id !== commentId);
    offers[offerIndex].comments = offer.comments;
    const preparedOffers = JSON.stringify(offers, null, `  `);
    await fs.writeFile(FILE_NAME, preparedOffers);
  } catch (error) {
    return res.status(HTTP_CODE.INTERNAL_SERVER_ERROR).send(`Something went wrong`);
  }

  return res.send(commentId);
});

offersRoute.post(`/:offerId/comments`, async (req, res) => {
  const id = req.params.offerId;
  const comment = req.body;
  let offers = await readMocks();
  const offer = find(offers, [`id`, id]);

  if (!offer) {
    return res.status(HTTP_CODE.NOT_FOUND).send(offers);
  }

  try {
    offers = offers.map((item) => {
      if (item.id === id) {
        return {...item, comments: [...item.comments, {id: nanoid(6), text: comment.text}]};
      }
      return item;
    });

    const preparedOffers = JSON.stringify(offers, null, `  `);
    await fs.writeFile(FILE_NAME, preparedOffers);
  } catch (error) {
    console.log(error);
    return res.status(HTTP_CODE.INTERNAL_SERVER_ERROR).send(`Something went wrong`);
  }

  return res.send(comment);
});

module.exports = offersRoute;