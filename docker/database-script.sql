CREATE TABLE asset_state (
    asset_id                          text PRIMARY KEY,

    -- REQ-COUNTER-SET counters, lifetime scope (REQ-BASELINES + this run)
    lifetime_engine_hours             numeric NOT NULL,
    lifetime_total_working_hours      numeric NOT NULL,
    lifetime_high_load_hours          numeric NOT NULL,
    lifetime_temp_excursion_hours     numeric NOT NULL,
    lifetime_vibration_alert_hours    numeric NOT NULL,

    -- REQ-COUNTER-SET counters, rolling 24 h scope (REQ-SCOPES)
    rolling_24h_engine_hours          numeric NOT NULL,
    rolling_24h_total_working_hours   numeric NOT NULL,
    rolling_24h_high_load_hours       numeric NOT NULL,
    rolling_24h_temp_excursion_hours  numeric NOT NULL,
    rolling_24h_vibration_alert_hours numeric NOT NULL,

    -- REQ-UTILIZATION
    window_coverage_hours             numeric NOT NULL,
    utilization_percent               numeric NULL,
    productive_share_percent          numeric NULL,

    -- REQ-STATUS, REQ-LIVE, REQ-RANK, REQ-RECOMMEND
    status                            text NOT NULL,
    live_condition                    text NOT NULL,
    recommendation                    text NOT NULL,
    priority_rank                     integer NOT NULL,

    -- REQ-FLAGS flags; NULL value means the flag is inactive
    heavy_recent_use_value            numeric NULL,
    heavy_recent_use_threshold        numeric NULL,
    thermal_load_value                numeric NULL,
    thermal_load_threshold            numeric NULL,
    mechanical_attention_value        numeric NULL,
    mechanical_attention_threshold    numeric NULL,
    high_cumulative_load_value        numeric NULL,
    high_cumulative_load_threshold    numeric NULL,

    -- REQ-TELEMETRY-SHAPE most recent message; all NULL until the asset reports
    latest_timestamp                  timestamptz NULL,
    latest_pto_engaged                boolean NULL,
    latest_ground_speed_kmh           numeric NULL,
    latest_load_factor                numeric NULL,
    latest_temperature_c              numeric NULL,
    latest_vibration_level            text NULL,

    updated_at                        timestamptz NOT NULL
);

CREATE TABLE hourly_aggregate (
    asset_id              text NOT NULL,
    hour_start            timestamptz NOT NULL,
    engine_hours          numeric NOT NULL,
    total_working_hours   numeric NOT NULL,
    high_load_hours       numeric NOT NULL,
    temp_excursion_hours  numeric NOT NULL,
    vibration_alert_hours numeric NOT NULL,
    PRIMARY KEY (asset_id, hour_start)
);

CREATE INDEX idx_hourly_aggregate_hour_start ON hourly_aggregate (hour_start);
