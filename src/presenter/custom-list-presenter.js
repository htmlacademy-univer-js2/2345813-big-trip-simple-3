import { escape } from 'he';
import { formatDate, formatTime, formatNumber } from '../utils/formats.js';

import {ModeEnum} from '../utils/enums.js';
import {PointTypeEnum} from '../utils/enums.js';
import {PointLabelEnum} from '../utils/enums.js';

import Presenter from './presenter.js';

/**
 * @template {TripPlannerModel} Model
 * @template {ListView} View
 * @extends {Presenter<Model,View>}
 */
export default class CustomListPresenter extends Presenter {
  /**
   * @param {[model: Model, view: View]} args
   */
  constructor(...args) {
    super(...args);

    this.updateView();

    this.view.addEventListener('edit', this.handleViewEdit.bind(this));

    this.model.pointsModel.addEventListener(
      ['add', 'update', 'remove', 'filter', 'sort'],
      this.handlePointsModelChange.bind(this)
    );
  }

  /**
   * @param {string} [revealingPointId]
   */
  updateView(revealingPointId) {
    const points = this.model.pointsModel.list();

    const states = points.map((point, index) => {
      const { startDate, endDate } = point;
      const destination = this.model.destinationsModel.findById(point.destinationId);
      const typeLabel = PointLabelEnum[Object.keys(PointTypeEnum).find((key) => PointTypeEnum[key] === point.type)];
      const title = `${typeLabel} ${destination.name}`;
      const offerGroup = this.model.offerGroupsModel.findById(point.type);

      const offerStates = offerGroup.items.reduce((result, offer) => {
        if (point.offerIds.includes(offer.id)) {
          result.push([escape(offer.title), escape(formatNumber(offer.price))]);
        }

        return result;
      }, []);

      if (revealingPointId) {
        index = (revealingPointId === point.id) ? 0 : null;
      }

      return {
        id: escape(point.id),
        index,
        type: escape(point.type),
        startIsoDate: escape(startDate),
        endIsoDate: escape(endDate),
        title: escape(title),
        icon: escape(point.type),
        startDate: formatDate(startDate),
        startTime: formatTime(startDate),
        endTime: formatTime(endDate),
        price: escape(formatNumber(point.basePrice)),
        offers: offerStates
      };
    });

    this.view.setPoints(states);
  }

  /**
   * @param {CustomEvent<PointAdapter> & CustomEvent<[newItem: PointAdapter, oldItem: PointAdapter]>} event
   */
  handlePointsModelChange(event) {
    if (event.type === 'add') {
      this.updateView(event.detail.id);

      return;
    }

    if (event.type === 'update') {
      const [point] = event.detail;

      this.updateView(point.id);

      return;
    }

    if (event.type === 'remove') {
      this.view.findById(event.detail.id).remove();

      return;
    }

    this.updateView();
  }

  /**
   * @param {CustomEvent & {target: PointView}} event
   */
  handleViewEdit(event) {
    this.model.setMode(ModeEnum.EDIT, event.target.getId());
  }
}
