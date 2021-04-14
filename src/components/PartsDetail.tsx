import * as React from "react";
import { hot } from "react-hot-loader";
import "./../assets/scss/PartsDetail.scss";

// webpack serve --config=configs/webpack/dev.js --env filename="parts-detail-app.tsx"
// webpack --config=configs/webpack/prod.js --env filename="parts-detail-app.tsx"

class PartsDetail extends React.Component<Record<string, unknown>, undefined> {
    public render() {
        return (
            <div>
                Parts Detail
            </div>
        );
    }
}

declare let module: Record<string, unknown>;

export default hot(module)(PartsDetail);
