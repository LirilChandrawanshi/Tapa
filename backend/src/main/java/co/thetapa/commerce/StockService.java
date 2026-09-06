package co.thetapa.commerce;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Inventory with no oversell: stock moves only through atomic findAndModify
 * (filter includes {@code stock >= qty}), so two concurrent payments for the
 * last unit cannot both succeed. Untracked products (stock == null) skip all
 * of this. LIVE flips to SOLD_OUT at zero and back on restock, which also
 * fires the restock-notification hook.
 */
@Service
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);

    private final MongoTemplate mongo;
    private final NotifyOnRestock notifier;

    public StockService(MongoTemplate mongo, NotifyOnRestock notifier) {
        this.mongo = mongo;
        this.notifier = notifier;
    }

    /** @return the slug that could not be reserved, or null when all lines succeeded */
    public String reserveAll(List<Order.Line> lines) {
        for (int i = 0; i < lines.size(); i++) {
            Order.Line line = lines.get(i);
            if (!tryDecrement(line.productSlug(), line.qty())) {
                // roll back what we already took
                for (int j = 0; j < i; j++) {
                    restore(lines.get(j).productSlug(), lines.get(j).qty());
                }
                return line.productSlug();
            }
        }
        return null;
    }

    boolean tryDecrement(String slug, int qty) {
        Product tracked = mongo.findOne(Query.query(
            Criteria.where("slug").is(slug).and("stock").ne(null)), Product.class);
        if (tracked == null) {
            return true; // untracked stock — nothing to reserve
        }
        Product updated = mongo.findAndModify(
            Query.query(Criteria.where("slug").is(slug).and("stock").gte(qty)),
            new Update().inc("stock", -qty),
            FindAndModifyOptions.options().returnNew(true),
            Product.class);
        if (updated == null) {
            return false;
        }
        if (updated.getStock() != null && updated.getStock() == 0
            && updated.getAvailability() == Product.Availability.LIVE) {
            mongo.updateFirst(Query.query(Criteria.where("slug").is(slug)),
                Update.update("availability", Product.Availability.SOLD_OUT), Product.class);
            log.info("stock: {} sold out", slug);
        }
        return true;
    }

    public void restore(String slug, int qty) {
        Product updated = mongo.findAndModify(
            Query.query(Criteria.where("slug").is(slug).and("stock").ne(null)),
            new Update().inc("stock", qty),
            FindAndModifyOptions.options().returnNew(true),
            Product.class);
        if (updated == null) {
            return;
        }
        if (updated.getAvailability() == Product.Availability.SOLD_OUT
            && updated.getStock() != null && updated.getStock() > 0) {
            mongo.updateFirst(Query.query(Criteria.where("slug").is(slug)),
                Update.update("availability", Product.Availability.LIVE), Product.class);
            log.info("stock: {} back in stock ({} units)", slug, updated.getStock());
            notifier.onRestock(updated);
        }
    }

    public void restoreAll(List<Order.Line> lines) {
        lines.forEach(line -> restore(line.productSlug(), line.qty()));
    }
}
