package co.thetapa.commerce;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Admin-managed serviceability list (Delhi-NCR + selected pincodes for launch).
 * A logistics-partner API can replace the lookup behind the same endpoint later.
 */
@Document("pincode_serviceability")
public class PincodeServiceability {

    @Id
    private String id;

    @Indexed(unique = true)
    private String pincode;

    private boolean serviceable;
    private int etaDays = 3;
    private boolean codAllowed = false;   // COD is not built until Komal confirms (PRD)
    private String area;

    public PincodeServiceability() {
    }

    public PincodeServiceability(String pincode, boolean serviceable, int etaDays, String area) {
        this.pincode = pincode;
        this.serviceable = serviceable;
        this.etaDays = etaDays;
        this.area = area;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public boolean isServiceable() { return serviceable; }
    public void setServiceable(boolean serviceable) { this.serviceable = serviceable; }
    public int getEtaDays() { return etaDays; }
    public void setEtaDays(int etaDays) { this.etaDays = etaDays; }
    public boolean isCodAllowed() { return codAllowed; }
    public void setCodAllowed(boolean codAllowed) { this.codAllowed = codAllowed; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
}
